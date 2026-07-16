import { createHash } from "node:crypto";
import {
  AiSuggestionCache,
  GiftList,
  ListType,
  User,
  type AiSuggestionItem,
} from "@/entities";
import { withORM } from "@/lib/db";
import { generateGiftSuggestions, isGeminiConfigured } from "@/lib/gemini";

const TIME_ZONE = "Europe/Prague";

export function czechDateKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function isSuggestionStale(generatedAt: Date, now: Date = new Date()): boolean {
  return czechDateKey(generatedAt) !== czechDateKey(now);
}

export function fingerprintWishlistItems(
  items: Array<{ name: string; price?: string | null }>,
): string {
  const normalized = items
    .map((item) => `${item.name.trim().toLowerCase()}|${item.price ?? ""}`)
    .sort()
    .join("\n");
  return createHash("sha256").update(normalized).digest("hex");
}

export interface AiSuggestionsView {
  suggestions: AiSuggestionItem[];
  generatedAt: Date;
}

async function loadWishlistItems(userId: string) {
  const { getORM } = await import("@/lib/db");
  const em = (await getORM()).em.fork();
  const list = await em.findOne(
    GiftList,
    { owner: userId, type: ListType.PUBLIC_WISHLIST },
    { populate: ["items"] },
  );
  if (!list) return [];
  return list.items.getItems().map((item) => ({
    name: item.name,
    price: item.price,
  }));
}

async function upsertSuggestions(
  userId: string,
  suggestions: AiSuggestionItem[],
  sourceFingerprint: string,
): Promise<AiSuggestionsView> {
  const { getORM } = await import("@/lib/db");
  const em = (await getORM()).em.fork();
  const user = await em.findOneOrFail(User, { id: userId });
  let cache = await em.findOne(AiSuggestionCache, { user: userId });

  if (!cache) {
    cache = new AiSuggestionCache();
    cache.user = user;
    em.persist(cache);
  }

  cache.suggestions = suggestions;
  cache.sourceFingerprint = sourceFingerprint;
  cache.generatedAt = new Date();
  await em.flush();

  return {
    suggestions: cache.suggestions,
    generatedAt: cache.generatedAt,
  };
}

export async function getAiSuggestionsForUser(
  userId: string,
): Promise<AiSuggestionsView | null> {
  return withORM(async () => {
    const { getORM } = await import("@/lib/db");
    const em = (await getORM()).em.fork();
    const items = await loadWishlistItems(userId);

    if (items.length === 0) {
      const existing = await em.findOne(AiSuggestionCache, { user: userId });
      if (existing) {
        em.remove(existing);
        await em.flush();
      }
      return null;
    }

    const sourceFingerprint = fingerprintWishlistItems(items);
    const cache = await em.findOne(AiSuggestionCache, { user: userId });

    const fresh =
      cache &&
      !isSuggestionStale(cache.generatedAt) &&
      cache.sourceFingerprint === sourceFingerprint &&
      cache.suggestions.length > 0;

    if (fresh) {
      return {
        suggestions: cache.suggestions,
        generatedAt: cache.generatedAt,
      };
    }

    if (!isGeminiConfigured()) {
      if (cache?.suggestions.length) {
        return {
          suggestions: cache.suggestions,
          generatedAt: cache.generatedAt,
        };
      }
      return null;
    }

    try {
      const suggestions = await generateGiftSuggestions(items);
      return await upsertSuggestions(userId, suggestions, sourceFingerprint);
    } catch (error) {
      console.error("Failed to refresh AI gift suggestions", error);
      if (cache?.suggestions.length) {
        return {
          suggestions: cache.suggestions,
          generatedAt: cache.generatedAt,
        };
      }
      return null;
    }
  });
}
