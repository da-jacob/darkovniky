import Link from "next/link";
import { Card } from "@/components/Card";
import { AddItemForm, CreatePrivateListForm } from "@/components/ListForms";
import { FilterableGiftList } from "@/components/FilterableGiftList";
import { addItemAction, createPrivateListAction, getDashboardData } from "@/lib/actions/lists";
import { t } from "@/lib/i18n";
import { getRecipientLabel, getRecipientUsername } from "@/lib/recipient";

export default async function DashboardPage() {
  const { session, wishlist, privateLists } = await getDashboardData();

  const wishlistItems =
    wishlist?.items.getItems().map((item) => ({
      id: item.id,
      name: item.name,
      url: item.url,
      price: item.price,
    })) ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 animate-fade-in sm:px-6 sm:py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.dashboard.title}</h1>
        <p className="mt-2 text-muted">{t.dashboard.greeting(session.username)}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <section className="space-y-6 lg:col-span-3">
          <Card>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-accent">{t.dashboard.publicWishlist}</p>
                <h2 className="text-xl font-semibold">
                  {wishlist?.title ?? t.dashboard.defaultWishlistTitle}
                </h2>
                <p className="mt-1 text-sm text-muted">{t.dashboard.publicHint}</p>
              </div>
              {wishlist ? (
                <Link
                  href={`/wishlist/${session.username}`}
                  className="rounded-xl border border-border px-3 py-2 text-sm font-medium transition hover:bg-stone-50"
                >
                  {t.dashboard.viewPublicPage}
                </Link>
              ) : null}
            </div>

            {wishlist ? (
              <>
                <div className="mb-6 border-b border-border pb-6">
                  <h3 className="mb-3 text-sm font-medium">{t.dashboard.addGift}</h3>
                  <AddItemForm listId={wishlist.id} action={addItemAction} />
                </div>
                <FilterableGiftList
                  items={wishlistItems}
                  emptyMessage={t.dashboard.emptyWishlist}
                  showDelete
                />
              </>
            ) : null}
          </Card>
        </section>

        <section className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="text-lg font-semibold">{t.dashboard.privateIdeas}</h2>
            <p className="mt-1 text-sm text-muted">{t.dashboard.privateHint}</p>

            <div className="mt-5 border-t border-border pt-5">
              <h3 className="mb-3 text-sm font-medium">{t.dashboard.createList}</h3>
              <CreatePrivateListForm action={createPrivateListAction} />
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted">
              {t.dashboard.yourPrivateLists}
            </h3>
            {privateLists.length === 0 ? (
              <p className="text-sm text-muted">{t.dashboard.noPrivateLists}</p>
            ) : (
              <ul className="space-y-3">
                {privateLists.map((list) => (
                  <li key={list.id}>
                    <Link
                      href={`/dashboard/lists/${list.id}`}
                      className="block rounded-xl border border-border p-3 transition hover:border-accent/40 hover:bg-accent-soft/30"
                    >
                      <p className="font-medium">{list.title}</p>
                      <p className="mt-0.5 text-sm text-muted">
                        {t.dashboard.forRecipient(
                          getRecipientLabel(list),
                          list.items.length,
                          getRecipientUsername(list),
                        )}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
