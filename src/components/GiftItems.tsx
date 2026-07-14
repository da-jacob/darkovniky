"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { formatPrice, t } from "@/lib/i18n";

export interface GiftItemView {
  id: string;
  name: string;
  url?: string | null;
  price?: string | null;
}

export function PriceFilter({
  minPrice,
  maxPrice,
  onMinChange,
  onMaxChange,
  onClear,
}: {
  minPrice: string;
  maxPrice: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  onClear: () => void;
}) {
  const active = minPrice || maxPrice;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-[120px] flex-1">
        <label className="mb-1 block text-xs font-medium text-muted">{t.items.minPrice}</label>
        <input
          type="number"
          min="0"
          step="1"
          value={minPrice}
          onChange={(e) => onMinChange(e.target.value)}
          placeholder="0"
          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>
      <div className="min-w-[120px] flex-1">
        <label className="mb-1 block text-xs font-medium text-muted">{t.items.maxPrice}</label>
        <input
          type="number"
          min="0"
          step="1"
          value={maxPrice}
          onChange={(e) => onMaxChange(e.target.value)}
          placeholder={t.items.anyPrice}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>
      {active ? (
        <button
          type="button"
          onClick={onClear}
          className="rounded-xl px-3 py-2 text-sm font-medium text-muted transition hover:bg-stone-100"
        >
          {t.items.clear}
        </button>
      ) : null}
    </div>
  );
}

export function usePriceFilter(items: GiftItemView[]) {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const filteredItems = useMemo(() => {
    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;

    return items.filter((item) => {
      if (!item.price) {
        if (min !== null || max !== null) return false;
        return true;
      }
      const price = Number(item.price);
      if (Number.isNaN(price)) return true;
      if (min !== null && price < min) return false;
      if (max !== null && price > max) return false;
      return true;
    });
  }, [items, minPrice, maxPrice]);

  return {
    minPrice,
    maxPrice,
    setMinPrice,
    setMaxPrice,
    filteredItems,
    clearFilters: () => {
      setMinPrice("");
      setMaxPrice("");
    },
  };
}

export function GiftItemCard({
  item,
  onDelete,
  showDelete = false,
}: {
  item: GiftItemView;
  onDelete?: () => void;
  showDelete?: boolean;
}) {
  const price = formatPrice(item.price);

  return (
    <article className="group flex items-start justify-between gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:border-accent/30 hover:shadow-sm">
      <div className="min-w-0 flex-1">
        <h3 className="font-medium leading-snug">{item.name}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
          {price ? (
            <span className="rounded-full bg-accent-soft px-2.5 py-0.5 font-medium text-accent">
              {price}
            </span>
          ) : (
            <span className="text-muted">{t.items.noPrice}</span>
          )}
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate font-medium text-accent underline-offset-2 hover:underline"
            >
              {t.items.viewLink}
            </a>
          ) : null}
        </div>
      </div>
      {showDelete && onDelete ? (
        <button
          type="button"
          onClick={onDelete}
          className={cn(
            "shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-red-600 opacity-100 transition hover:bg-red-50 sm:opacity-0 sm:group-hover:opacity-100",
          )}
          aria-label={t.items.removeAria(item.name)}
        >
          {t.items.remove}
        </button>
      ) : null}
    </article>
  );
}

export function GiftItemList({
  items,
  emptyMessage,
  onDeleteItem,
  showDelete = false,
}: {
  items: GiftItemView[];
  emptyMessage: string;
  onDeleteItem?: (id: string) => void;
  showDelete?: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-stone-50/80 px-4 py-10 text-center text-sm text-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id}>
          <GiftItemCard
            item={item}
            showDelete={showDelete}
            onDelete={onDeleteItem ? () => onDeleteItem(item.id) : undefined}
          />
        </li>
      ))}
    </ul>
  );
}
