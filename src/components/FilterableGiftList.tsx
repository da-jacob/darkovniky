"use client";

import { useRouter } from "next/navigation";
import {
  GiftItemList,
  PriceFilter,
  usePriceFilter,
  type GiftItemView,
} from "@/components/GiftItems";
import { deleteItemAction } from "@/lib/actions/lists";
import { formatShowingCount } from "@/lib/i18n";

export function FilterableGiftList({
  items,
  emptyMessage,
  showDelete = false,
}: {
  items: GiftItemView[];
  emptyMessage: string;
  showDelete?: boolean;
}) {
  const router = useRouter();
  const { minPrice, maxPrice, setMinPrice, setMaxPrice, filteredItems, clearFilters } =
    usePriceFilter(items);

  async function handleDelete(id: string) {
    await deleteItemAction(id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <PriceFilter
        minPrice={minPrice}
        maxPrice={maxPrice}
        onMinChange={setMinPrice}
        onMaxChange={setMaxPrice}
        onClear={clearFilters}
      />
      <p className="text-sm text-muted">
        {formatShowingCount(filteredItems.length, items.length)}
      </p>
      <GiftItemList
        items={filteredItems}
        emptyMessage={emptyMessage}
        showDelete={showDelete}
        onDeleteItem={showDelete ? handleDelete : undefined}
      />
    </div>
  );
}
