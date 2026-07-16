import { GoogleGenAI, Type } from "@google/genai";
import type { AiSuggestionItem } from "@/entities";

const SUGGESTION_COUNT = 5;
const MODEL = "gemini-3.5-flash";

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export async function generateGiftSuggestions(
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
- U každého nápadu uveď krátké zdůvodnění (1–2 věty) a orientační cenu v Kč.
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
              },
              propertyOrdering: ["name", "reason", "approximatePriceCzk"],
              required: ["name", "reason"],
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

    suggestions.push({
      name,
      reason,
      approximatePriceCzk: price,
    });

    if (suggestions.length >= SUGGESTION_COUNT) break;
  }

  if (suggestions.length === 0) {
    throw new Error("Gemini returned no usable suggestions");
  }

  return suggestions;
}
