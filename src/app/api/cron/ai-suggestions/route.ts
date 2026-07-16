import { NextResponse } from "next/server";
import { refreshStaleAiSuggestionsForAllUsers } from "@/lib/ai-suggestions";
import { isGeminiConfigured } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGeminiConfigured()) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured" },
      { status: 503 },
    );
  }

  const result = await refreshStaleAiSuggestionsForAllUsers();
  return NextResponse.json({ ok: true, ...result });
}
