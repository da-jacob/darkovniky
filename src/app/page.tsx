import Link from "next/link";
import { Card } from "@/components/Card";
import { getPublicWishlists } from "@/lib/actions/lists";
import { getSession } from "@/lib/auth";
import { formatItemCount, t } from "@/lib/i18n";

export default async function HomePage() {
  const [wishlists, session] = await Promise.all([getPublicWishlists(), getSession()]);

  return (
    <div className="animate-fade-in">
      <section className="border-b border-border bg-gradient-to-b from-accent-soft/60 to-background px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-accent">
            {t.home.tagline}
          </p>
          <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {t.home.headline}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            {t.home.description}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {session ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-medium text-white transition hover:bg-accent-hover"
              >
                {t.home.goToDashboard}
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-medium text-white transition hover:bg-accent-hover"
                >
                  {t.home.getStarted}
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-5 py-3 text-sm font-medium transition hover:bg-stone-50"
                >
                  {t.nav.logIn}
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold sm:text-2xl">{t.home.publicWishlists}</h2>
            <p className="mt-1 text-sm text-muted">{t.home.publicWishlistsHint}</p>
          </div>
        </div>

        {wishlists.length === 0 ? (
          <Card className="text-center text-muted">
            {t.home.noWishlists}{" "}
            <Link href="/register" className="font-medium text-accent hover:underline">
              {t.home.signUpLink}
            </Link>
            .
          </Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wishlists.map((list) => (
              <li key={list.username}>
                <Link href={`/wishlist/${list.username}`}>
                  <Card className="h-full transition hover:border-accent/40 hover:shadow-md">
                    <p className="text-sm font-medium text-accent">@{list.username}</p>
                    <h3 className="mt-1 text-lg font-semibold">{list.title}</h3>
                    <p className="mt-2 text-sm text-muted">{formatItemCount(list.itemCount)}</p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
