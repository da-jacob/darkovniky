import { formatPrice, t } from "@/lib/i18n";
import type { AiSuggestionItem } from "@/entities";

function formatGeneratedAt(date: Date | string): string {
  const value = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat("cs-CZ", {
    timeZone: "Europe/Prague",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

export function AiSuggestions({
  suggestions,
  generatedAt,
}: {
  suggestions: AiSuggestionItem[];
  generatedAt: Date;
}) {
  if (suggestions.length === 0) return null;

  return (
    <section className="rounded-2xl border border-accent/20 bg-gradient-to-b from-accent-soft/50 to-surface p-4 shadow-sm sm:p-5">
      <p className="text-sm font-medium text-accent">{t.aiSuggestions.label}</p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight">{t.aiSuggestions.title}</h2>
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
