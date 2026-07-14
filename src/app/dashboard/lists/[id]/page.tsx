import Link from "next/link";
import { Card } from "@/components/Card";
import { DeletePrivateListButton } from "@/components/DeletePrivateListButton";
import { FilterableGiftList } from "@/components/FilterableGiftList";
import { AddItemForm } from "@/components/ListForms";
import { addItemAction, getPrivateList } from "@/lib/actions/lists";
import { t } from "@/lib/i18n";
import { getRecipientLabel, getRecipientUsername } from "@/lib/recipient";

export default async function PrivateListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { list } = await getPrivateList(id);

  const items = list.items.getItems().map((item) => ({
    id: item.id,
    name: item.name,
    url: item.url,
    price: item.price,
  }));

  const linkedUsername = getRecipientUsername(list);
  const recipientLabel = getRecipientLabel(list);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 animate-fade-in sm:px-6 sm:py-10">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex text-sm font-medium text-muted transition hover:text-accent"
      >
        {t.privateList.back}
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-accent">{t.privateList.label}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{list.title}</h1>
          <p className="mt-2 text-muted">
            {linkedUsername
              ? t.privateList.giftIdeasForUser(linkedUsername)
              : t.privateList.giftIdeasFor(recipientLabel)}
          </p>
          {linkedUsername ? (
            <Link
              href={`/wishlist/${linkedUsername}`}
              className="mt-3 inline-flex rounded-xl border border-border px-3 py-2 text-sm font-medium transition hover:border-accent/40 hover:bg-accent-soft/30"
            >
              {t.privateList.viewWishlist}
            </Link>
          ) : null}
        </div>
        <DeletePrivateListButton listId={list.id} />
      </div>

      <div className="space-y-6">
        <Card>
          <h2 className="mb-4 text-sm font-medium">{t.privateList.addIdea}</h2>
          <AddItemForm listId={list.id} action={addItemAction} />
        </Card>

        <Card>
          <FilterableGiftList items={items} emptyMessage={t.privateList.empty} showDelete />
        </Card>
      </div>
    </div>
  );
}
