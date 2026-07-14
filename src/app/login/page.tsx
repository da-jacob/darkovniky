import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { Card } from "@/components/Card";
import { loginAction } from "@/lib/actions/auth";
import { getSession } from "@/lib/auth";
import { t } from "@/lib/i18n";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col justify-center px-4 py-10 animate-fade-in">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">{t.auth.welcomeBack}</h1>
        <p className="mt-2 text-sm text-muted">{t.auth.loginHint}</p>
      </div>
      <Card>
        <AuthForm action={loginAction} submitLabel={t.auth.login} fields="login" />
      </Card>
      <p className="mt-6 text-center text-sm text-muted">
        {t.auth.noAccount}{" "}
        <Link href="/register" className="font-medium text-accent hover:underline">
          {t.nav.signUp}
        </Link>
      </p>
    </div>
  );
}
