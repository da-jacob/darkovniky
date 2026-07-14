"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { UserSearchPicker, type SelectedUser } from "@/components/UserSearchPicker";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";
import type { ActionResult } from "@/lib/utils";

const initialState: ActionResult = { success: true };
const createListInitialState: ActionResult<{ id: string }> = { success: true };

export function AddItemForm({
  listId,
  action,
}: {
  listId: string;
  action: (
    listId: string,
    prev: ActionResult,
    formData: FormData,
  ) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const prevPending = useRef(false);
  const boundAction = action.bind(null, listId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  useEffect(() => {
    if (prevPending.current && !pending && state.success) {
      formRef.current?.reset();
      router.refresh();
    }
    prevPending.current = pending;
  }, [pending, state.success, router]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <Input
        label={t.items.name}
        name="name"
        required
        placeholder={t.items.namePlaceholder}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label={t.items.url} name="url" type="url" placeholder="https://…" />
        <Input
          label={t.items.price}
          name="price"
          type="number"
          min="0"
          step="1"
          placeholder={t.items.pricePlaceholder}
        />
      </div>

      {!state.success ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? t.items.adding : t.items.add}
      </Button>
    </form>
  );
}

type RecipientMode = "registered" | "guest";

export function CreatePrivateListForm({
  action,
}: {
  action: (
    prev: ActionResult<{ id: string }>,
    formData: FormData,
  ) => Promise<ActionResult<{ id: string }>>;
}) {
  const router = useRouter();
  const prevPending = useRef(false);
  const [state, formAction, pending] = useActionState(action, createListInitialState);
  const [mode, setMode] = useState<RecipientMode>("registered");
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);

  useEffect(() => {
    if (prevPending.current && !pending && state.success && state.data?.id) {
      router.push(`/dashboard/lists/${state.data.id}`);
    }
    prevPending.current = pending;
  }, [pending, state, router]);

  return (
    <form action={formAction} className="space-y-3">
      <Input
        label={t.privateListForm.title}
        name="title"
        required
        placeholder={t.privateListForm.titlePlaceholder}
      />

      <div className="space-y-2">
        <span className="block text-sm font-medium text-foreground">{t.privateListForm.recipient}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("registered");
              setSelectedUser(null);
            }}
            className={cn(
              "flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition",
              mode === "registered"
                ? "border-accent bg-accent-soft text-accent"
                : "border-border text-muted hover:bg-stone-50",
            )}
          >
            {t.privateListForm.modeRegistered}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("guest");
              setSelectedUser(null);
            }}
            className={cn(
              "flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition",
              mode === "guest"
                ? "border-accent bg-accent-soft text-accent"
                : "border-border text-muted hover:bg-stone-50",
            )}
          >
            {t.privateListForm.modeGuest}
          </button>
        </div>
      </div>

      {mode === "registered" ? (
        <UserSearchPicker selected={selectedUser} onSelect={setSelectedUser} />
      ) : (
        <Input
          label={t.privateListForm.recipient}
          name="recipientName"
          required
          placeholder={t.privateListForm.recipientPlaceholder}
        />
      )}

      {!state.success ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      <Button
        type="submit"
        disabled={pending || (mode === "registered" && !selectedUser)}
      >
        {pending ? t.privateListForm.creating : t.privateListForm.create}
      </Button>
    </form>
  );
}
