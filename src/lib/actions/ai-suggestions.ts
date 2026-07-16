"use server";

import { User } from "@/entities";
import {
  refreshAiSuggestionsForUser,
  type AiSuggestionsView,
} from "@/lib/ai-suggestions";
import { withORM } from "@/lib/db";
import { t } from "@/lib/i18n";
import { fail, ok, type ActionResult } from "@/lib/utils";

export interface AiSuggestionsPayload {
  suggestions: AiSuggestionsView["suggestions"];
  generatedAt: string;
}

export async function refreshAiSuggestionsAction(
  username: string,
): Promise<ActionResult<AiSuggestionsPayload>> {
  const normalized = username.trim().toLowerCase();
  if (!normalized) return fail(t.errors.userNotFound);

  return withORM(async () => {
    const { getORM } = await import("@/lib/db");
    const em = (await getORM()).em.fork();
    const user = await em.findOne(User, { username: normalized });
    if (!user) return fail(t.errors.userNotFound);

    try {
      const result = await refreshAiSuggestionsForUser(user.id);
      if (!result) return fail(t.aiSuggestions.error);

      return ok({
        suggestions: result.suggestions,
        generatedAt: result.generatedAt.toISOString(),
      });
    } catch (error) {
      console.error("AI suggestions refresh failed", error);
      return fail(t.aiSuggestions.error);
    }
  });
}
