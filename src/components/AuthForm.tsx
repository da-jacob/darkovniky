"use client";

import { useActionState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { t } from "@/lib/i18n";
import type { ActionResult } from "@/lib/utils";

const initialState: ActionResult = { success: true };

export function AuthForm({
  action,
  submitLabel,
  fields,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  submitLabel: string;
  fields: "login" | "register";
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <Input
        label={t.auth.username}
        name="username"
        autoComplete="username"
        required
        minLength={3}
        placeholder={t.auth.usernamePlaceholder}
      />
      <Input
        label={t.auth.password}
        name="password"
        type="password"
        autoComplete={fields === "register" ? "new-password" : "current-password"}
        required
        minLength={6}
        placeholder="••••••••"
      />
      {fields === "register" ? (
        <Input
          label={t.auth.confirmPassword}
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="••••••••"
        />
      ) : null}

      {!state.success ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t.auth.pleaseWait : submitLabel}
      </Button>
    </form>
  );
}
