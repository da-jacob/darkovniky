import { GoogleGenAI, Type } from "@google/genai";
import type { AiSuggestionItem } from "@/entities";

const SUGGESTION_COUNT = 5;
const MODEL = "gemini-3.1-flash-lite";
const INITIAL_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 60_000;

const SHOPS = ["heureka", "alza", "datart"] as const;
type Shop = (typeof SHOPS)[number];

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseShop(value: string | null | undefined): Shop {
  const normalized = value?.trim().toLowerCase();
  if (normalized && (SHOPS as readonly string[]).includes(normalized)) {
    return normalized as Shop;
  }
  return "heureka";
}

/** Build a working search URL — never use LLM-invented product IDs. */
export function buildShopSearchUrl(shop: Shop, productName: string): string {
  const query = encodeURIComponent(productName);
  switch (shop) {
    case "alza":
      return `https://www.alza.cz/search.htm?exps=${query}`;
    case "datart":
      return `https://www.datart.cz/vyhledavani?q=${query}`;
    case "heureka":
    default:
      return `https://www.heureka.cz/?h%5Bfraze%5D=${query}`;
  }
}

async function generateGiftSuggestionsOnce(
  wishlistItems: Array<{ name: string; price?: string | null }>,
): Promise<AiSuggestionItem[]> {
  const ai = getClient();
  if (!ai) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  if (wishlistItems.length === 0) {
    return [];
  }

  const itemLines = wishlistItems
    .map((item) => {
      const price =
        item.price && !Number.isNaN(Number(item.price))
          ? ` (cca ${Math.round(Number(item.price))} Kč)`
          : "";
      return `- ${item.name}${price}`;
    })
    .join("\n");

  const prompt = `Jsi český asistent na dárky. Na základě následujícího veřejného seznamu přání navrhni ${SUGGESTION_COUNT} nových nápadů na dárky, které by se dané osobě mohly líbit.

Pravidla:
- Piš výhradně česky.
- Nenavrhuj položky, které už na seznamu jsou (ani drobné varianty stejného produktu).
- Nápady ať ladí se stylem, zájmy a cenovou hladinou seznamu.
- U každého nápadu uveď krátké zdůvodnění (1–2 věty), orientační cenu v Kč a preferovaný obchod (shop).
- shop musí být jedno z: heureka, alza, datart — podle toho, kde se dárek typicky shání.
- NEVYMÝŠLEJ žádné URL ani produktová ID — odkazy se sestaví automaticky.
- Navrhuj konkrétní, koupitelné dárky vhodné pro český trh.

Seznam přání:
${itemLines}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: Type.OBJECT,
        properties: {
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: "Název navrhovaného dárku",
                },
                reason: {
                  type: Type.STRING,
                  description: "Krátké zdůvodnění, proč se dárek hodí",
                },
                approximatePriceCzk: {
                  type: Type.NUMBER,
                  description: "Orientační cena v Kč",
                },
                shop: {
                  type: Type.STRING,
                  description: "Preferovaný obchod: heureka, alza nebo datart",
                  enum: [...SHOPS],
                },
              },
              propertyOrdering: ["name", "reason", "approximatePriceCzk", "shop"],
              required: ["name", "reason", "shop"],
            },
          },
        },
        propertyOrdering: ["suggestions"],
        required: ["suggestions"],
      },
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  const parsed = JSON.parse(text) as {
    suggestions?: Array<{
      name?: string;
      reason?: string;
      approximatePriceCzk?: number | null;
      shop?: string | null;
    }>;
  };

  const suggestions: AiSuggestionItem[] = [];

  for (const item of parsed.suggestions ?? []) {
    const name = item.name?.trim();
    const reason = item.reason?.trim();
    if (!name || !reason) continue;

    const price =
      typeof item.approximatePriceCzk === "number" &&
      Number.isFinite(item.approximatePriceCzk) &&
      item.approximatePriceCzk >= 0
        ? Math.round(item.approximatePriceCzk)
        : null;

    const shop = parseShop(item.shop);

    suggestions.push({
      name,
      reason,
      approximatePriceCzk: price,
      url: buildShopSearchUrl(shop, name),
    });

    if (suggestions.length >= SUGGESTION_COUNT) break;
  }

  if (suggestions.length === 0) {
    throw new Error("Gemini returned no usable suggestions");
  }

  return suggestions;
}

/** Retries with exponential backoff until Gemini returns usable suggestions. */
export async function generateGiftSuggestions(
  wishlistItems: Array<{ name: string; price?: string | null }>,
): Promise<AiSuggestionItem[]> {
  let attempt = 0;

  while (true) {
    attempt += 1;
    try {
      return await generateGiftSuggestionsOnce(wishlistItems);
    } catch (error) {
      const delay = Math.min(
        INITIAL_RETRY_DELAY_MS * 2 ** Math.min(attempt - 1, 6),
        MAX_RETRY_DELAY_MS,
      );
      console.warn(
        `Gemini gift suggestions failed (attempt ${attempt}), retrying in ${delay}ms`,
        error,
      );
      await sleep(delay);
    }
  }
}
