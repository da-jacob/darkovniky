"use client";

import { useEffect, useState } from "react";
import { searchUsersAction } from "@/lib/actions/lists";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

export interface SelectedUser {
  id: string;
  username: string;
}

export function UserSearchPicker({
  selected,
  onSelect,
}: {
  selected: SelectedUser | null;
  onSelect: (user: SelectedUser | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SelectedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (selected) return;

    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      const users = await searchUsersAction(q);
      setResults(users);
      setLoading(false);
      setOpen(true);
    }, 250);

    return () => clearTimeout(timer);
  }, [query, selected]);

  if (selected) {
    return (
      <div className="space-y-1.5">
        <span className="block text-sm font-medium text-foreground">{t.privateListForm.searchUsers}</span>
        <div className="flex items-center justify-between rounded-xl border border-accent/30 bg-accent-soft/40 px-3.5 py-2.5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-accent">
              {t.privateListForm.selectedUser}
            </p>
            <p className="font-medium">@{selected.username}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setQuery("");
              setResults([]);
            }}
            className="rounded-lg px-2 py-1 text-sm font-medium text-muted transition hover:bg-white/60"
          >
            {t.privateListForm.clearSelection}
          </button>
        </div>
        <input type="hidden" name="recipientUserId" value={selected.id} />
      </div>
    );
  }

  return (
    <div className="relative space-y-1.5">
      <label htmlFor="user-search" className="block text-sm font-medium text-foreground">
        {t.privateListForm.searchUsers}
      </label>
      <input
        id="user-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={t.privateListForm.searchPlaceholder}
        autoComplete="off"
        className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none transition placeholder:text-stone-400 focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
      {loading ? (
        <p className="text-xs text-muted">{t.privateListForm.searching}</p>
      ) : null}
      {open && query.trim().length >= 2 && !loading ? (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-border bg-surface py-1 shadow-lg">
          {results.length === 0 ? (
            <li className="px-3.5 py-2 text-sm text-muted">{t.privateListForm.noUsersFound}</li>
          ) : (
            results.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onSelect(user);
                    setQuery("");
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center px-3.5 py-2.5 text-left text-sm transition hover:bg-accent-soft/50",
                  )}
                >
                  <span className="font-medium text-accent">@{user.username}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
