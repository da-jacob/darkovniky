import Link from "next/link";
import { t } from "@/lib/i18n";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-5xl">🎁</p>
      <h1 className="mt-4 text-2xl font-bold">{t.notFound.title}</h1>
      <p className="mt-2 text-muted">{t.notFound.description}</p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
      >
        {t.notFound.goHome}
      </Link>
    </div>
  );
}
