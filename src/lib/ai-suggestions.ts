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

function toValidDate(value: Date | string | number | null | undefined): Date | null {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function czechDateKey(value: Date | string | number = new Date()): string {
  const date = toValidDate(value) ?? new Date();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function isSuggestionStale(
  generatedAt: Date | string | number | null | undefined,
  now: Date = new Date(),
): boolean {
  const date = toValidDate(generatedAt);
  if (!date) return true;
  return czechDateKey(date) !== czechDateKey(now);
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

/** Fast DB-only read for the public wishlist page — never calls Gemini. */
export async function getCachedAiSuggestionsForUser(
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

    const cache = await em.findOne(AiSuggestionCache, { user: userId });
    if (!cache?.suggestions.length) return null;

    const generatedAt = toValidDate(cache.generatedAt);
    if (!generatedAt) return null;

    return {
      suggestions: cache.suggestions,
      generatedAt,
    };
  });
}

/**
 * Generates suggestions via Gemini (with internal retries until success)
 * and stores them. Skips when today's cache is already fresh.
 */
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
        generatedAt: toValidDate(cache.generatedAt) ?? new Date(),
      };
    }

    const suggestions = await generateGiftSuggestions(items);
    return upsertSuggestions(userId, suggestions, sourceFingerprint);
  });
}

export async function refreshStaleAiSuggestionsForAllUsers(): Promise<{
  refreshed: number;
  skipped: number;
}> {
  if (!isGeminiConfigured()) {
    return { refreshed: 0, skipped: 0 };
  }

  const { getORM } = await import("@/lib/db");
  const em = (await getORM()).em.fork();
  const lists = await em.find(
    GiftList,
    { type: ListType.PUBLIC_WISHLIST },
    { populate: ["owner", "items"] },
  );

  let refreshed = 0;
  let skipped = 0;

  for (const list of lists) {
    const items = list.items.getItems();
    if (items.length === 0) {
      skipped += 1;
      continue;
    }

    const sourceFingerprint = fingerprintWishlistItems(
      items.map((item) => ({ name: item.name, price: item.price })),
    );
    const cache = await em.findOne(AiSuggestionCache, { user: list.owner.id });
    const needsRefresh =
      !cache ||
      cache.suggestions.length === 0 ||
      isSuggestionStale(cache.generatedAt) ||
      cache.sourceFingerprint !== sourceFingerprint;

    if (!needsRefresh) {
      skipped += 1;
      continue;
    }

    // Retries until Gemini succeeds (see generateGiftSuggestions).
    await refreshAiSuggestionsForUser(list.owner.id);
    refreshed += 1;
  }

  return { refreshed, skipped };
}
