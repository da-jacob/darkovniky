import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AiSuggestions, AiSuggestionsSkeleton } from "@/components/AiSuggestions";
import { Card } from "@/components/Card";
import { FilterableGiftList } from "@/components/FilterableGiftList";
import { getAiSuggestionsForUser } from "@/lib/ai-suggestions";
import { getPublicWishlistByUsername } from "@/lib/actions/lists";
import { t } from "@/lib/i18n";

async function AiSuggestionsSection({ userId }: { userId: string }) {
  const result = await getAiSuggestionsForUser(userId);
  if (!result) return null;

  return (
    <AiSuggestions suggestions={result.suggestions} generatedAt={result.generatedAt} />
  );
}

export default async function PublicWishlistPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const list = await getPublicWishlistByUsername(username);

  if (!list) notFound();

  const items = list.items.getItems().map((item) => ({
    id: item.id,
    name: item.name,
    url: item.url,
    price: item.price,
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 animate-fade-in sm:px-6 sm:py-10">
      <div className="mb-8">
        <p className="text-sm font-medium text-accent">{t.publicWishlist.label}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{list.title}</h1>
        <p className="mt-2 text-muted">
          {t.publicWishlist.by}{" "}
          <Link href={`/wishlist/${list.owner.username}`} className="font-medium text-foreground">
            @{list.owner.username}
          </Link>
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <FilterableGiftList items={items} emptyMessage={t.publicWishlist.empty} />
        </Card>

        {items.length > 0 ? (
          <Suspense fallback={<AiSuggestionsSkeleton />}>
            <AiSuggestionsSection userId={list.owner.id} />
          </Suspense>
        ) : null}
      </div>
    </div>
  );
}
