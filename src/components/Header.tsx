import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import { t } from "@/lib/i18n";

export async function Header() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:h-16 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-sm text-white">
            🎁
          </span>
          <span className="text-lg">{t.appName}</span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          {session ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-accent-soft hover:text-accent"
              >
                {t.nav.dashboard}
              </Link>
              <Link
                href={`/wishlist/${session.username}`}
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-accent-soft hover:text-accent sm:inline"
              >
                {t.nav.myWishlist}
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-stone-100"
                >
                  {t.nav.logOut}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-stone-100"
              >
                {t.nav.logIn}
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover"
              >
                {t.nav.signUp}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
