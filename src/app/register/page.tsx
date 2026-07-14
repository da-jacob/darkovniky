import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { Card } from "@/components/Card";
import { registerAction } from "@/lib/actions/auth";
import { getSession } from "@/lib/auth";
import { t } from "@/lib/i18n";

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col justify-center px-4 py-10 animate-fade-in">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">{t.auth.createAccount}</h1>
        <p className="mt-2 text-sm text-muted">{t.auth.registerHint}</p>
      </div>
      <Card>
        <AuthForm action={registerAction} submitLabel={t.auth.register} fields="register" />
      </Card>
      <p className="mt-6 text-center text-sm text-muted">
        {t.auth.hasAccount}{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          {t.nav.logIn}
        </Link>
      </p>
    </div>
  );
}
