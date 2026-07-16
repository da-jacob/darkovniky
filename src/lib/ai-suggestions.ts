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

export interface CachedAiSuggestions {
  suggestions: AiSuggestionItem[];
  generatedAt: Date;
  needsRefresh: boolean;
  geminiConfigured: boolean;
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

/** Fast DB-only read — never calls Gemini. */
export async function getCachedAiSuggestionsForUser(
  userId: string,
): Promise<CachedAiSuggestions | null> {
  return withORM(async () => {
    const { getORM } = await import("@/lib/db");
    const em = (await getORM()).em.fork();
    const items = await loadWishlistItems(userId);
    const geminiConfigured = isGeminiConfigured();

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
    const hasSuggestions = Boolean(cache?.suggestions.length);

    if (!hasSuggestions && !geminiConfigured) {
      return null;
    }

    const needsRefresh =
      !cache ||
      !hasSuggestions ||
      isSuggestionStale(cache.generatedAt) ||
      cache.sourceFingerprint !== sourceFingerprint;

    return {
      suggestions: cache?.suggestions ?? [],
      generatedAt: cache?.generatedAt ?? new Date(0),
      needsRefresh: needsRefresh && geminiConfigured,
      geminiConfigured,
    };
  });
}

/** Calls Gemini and updates the cache. Intended for client-triggered refresh. */
export async function refreshAiSuggestionsForUser(
  userId: string,
): Promise<AiSuggestionsView | null> {
  if (!isGeminiConfigured()) return null;

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
    const alreadyFresh =
      cache &&
      cache.suggestions.length > 0 &&
      !isSuggestionStale(cache.generatedAt) &&
      cache.sourceFingerprint === sourceFingerprint;

    if (alreadyFresh) {
      return {
        suggestions: cache.suggestions,
        generatedAt: cache.generatedAt,
      };
    }

    const suggestions = await generateGiftSuggestions(items);
    return upsertSuggestions(userId, suggestions, sourceFingerprint);
  });
}
