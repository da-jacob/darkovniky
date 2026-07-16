"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { refreshAiSuggestionsAction } from "@/lib/actions/ai-suggestions";
import type { AiSuggestionItem } from "@/entities";
import { formatPrice, t } from "@/lib/i18n";

function formatGeneratedAt(date: Date): string {
  return new Intl.DateTimeFormat("cs-CZ", {
    timeZone: "Europe/Prague",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function AiSuggestionsSkeleton({ hint }: { hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
      <div className="h-4 w-40 animate-pulse rounded bg-stone-200" />
      <div className="mt-2 h-6 w-64 animate-pulse rounded bg-stone-200" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-xl bg-stone-100" />
        ))}
      </div>
      {hint ? <p className="mt-4 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

function SuggestionsList({
  suggestions,
  generatedAt,
  refreshing,
}: {
  suggestions: AiSuggestionItem[];
  generatedAt: Date;
  refreshing?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-accent/20 bg-gradient-to-b from-accent-soft/50 to-surface p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-accent">{t.aiSuggestions.label}</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">{t.aiSuggestions.title}</h2>
        </div>
        {refreshing ? (
          <p className="text-xs font-medium text-accent">{t.aiSuggestions.refreshing}</p>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-muted">{t.aiSuggestions.description}</p>

      <ul className="mt-5 space-y-3">
        {suggestions.map((suggestion) => {
          const price =
            suggestion.approximatePriceCzk != null
              ? formatPrice(String(suggestion.approximatePriceCzk))
              : null;

          return (
            <li
              key={`${suggestion.name}-${suggestion.reason}`}
              className="rounded-xl border border-border/80 bg-surface/80 px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-medium text-foreground">{suggestion.name}</h3>
                {price ? <span className="text-sm font-medium text-muted">{price}</span> : null}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted">{suggestion.reason}</p>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-xs text-muted">
        {t.aiSuggestions.updatedOn(formatGeneratedAt(generatedAt))}
      </p>
    </section>
  );
}

export function AiSuggestionsPanel({
  username,
  initialSuggestions,
  initialGeneratedAt,
  needsRefresh,
}: {
  username: string;
  initialSuggestions: AiSuggestionItem[];
  initialGeneratedAt: string | null;
  needsRefresh: boolean;
}) {
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [generatedAt, setGeneratedAt] = useState(
    initialGeneratedAt ? new Date(initialGeneratedAt) : null,
  );
  const [status, setStatus] = useState<"idle" | "loading" | "error">(
    needsRefresh ? "loading" : "idle",
  );
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (!needsRefresh && retryToken === 0) return;

    let cancelled = false;

    void (async () => {
      const result = await refreshAiSuggestionsAction(username);
      if (cancelled) return;

      if (!result.success || !result.data) {
        setStatus("error");
        return;
      }

      setSuggestions(result.data.suggestions);
      setGeneratedAt(new Date(result.data.generatedAt));
      setStatus("idle");
    })();

    return () => {
      cancelled = true;
    };
  }, [needsRefresh, username, retryToken]);

  if (status === "loading" && suggestions.length === 0) {
    return <AiSuggestionsSkeleton hint={t.aiSuggestions.loading} />;
  }

  if (status === "error" && suggestions.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-4 text-center shadow-sm sm:p-5">
        <p className="text-sm text-muted">{t.aiSuggestions.error}</p>
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          onClick={() => {
            setStatus("loading");
            setRetryToken((value) => value + 1);
          }}
        >
          {t.aiSuggestions.retry}
        </Button>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      <SuggestionsList
        suggestions={suggestions}
        generatedAt={generatedAt ?? new Date()}
        refreshing={status === "loading"}
      />
      {status === "error" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
          <p className="text-sm text-muted">{t.aiSuggestions.error}</p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setStatus("loading");
              setRetryToken((value) => value + 1);
            }}
          >
            {t.aiSuggestions.retry}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
