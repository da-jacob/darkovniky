"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { GiftItem, GiftList, ListType, User } from "@/entities";
import { getSession, requireSession } from "@/lib/auth";
import { withORM } from "@/lib/db";
import { t } from "@/lib/i18n";
import {
  fail,
  ok,
  parseOptionalUrl,
  parsePrice,
  type ActionResult,
} from "@/lib/utils";

async function getOwnedList(listId: string, userId: string): Promise<GiftList | null> {
  const { getORM } = await import("@/lib/db");
  const em = (await getORM()).em.fork();
  return em.findOne(GiftList, { id: listId, owner: userId });
}

export async function searchUsersAction(query: string): Promise<Array<{ id: string; username: string }>> {
  const session = await requireSession();
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  return withORM(async () => {
    const { getORM } = await import("@/lib/db");
    const em = (await getORM()).em.fork();
    const users = await em.find(
      User,
      {
        username: { $ilike: `${q}%` },
        id: { $ne: session.userId },
      },
      { limit: 8, orderBy: { username: "ASC" } },
    );
    return users.map((user) => ({ id: user.id, username: user.username }));
  });
}

export async function createPrivateListAction(
  _prev: ActionResult<{ id: string }>,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  const title = (formData.get("title") as string)?.trim();
  const recipientName = (formData.get("recipientName") as string)?.trim();
  const recipientUserId = (formData.get("recipientUserId") as string)?.trim();

  if (!title) return fail(t.errors.titleRequired);

  if (!recipientUserId && !recipientName) {
    return fail(t.errors.recipientOrUserRequired);
  }

  return withORM(async () => {
    const { getORM } = await import("@/lib/db");
    const em = (await getORM()).em.fork();
    const owner = await em.findOneOrFail(User, { id: session.userId });

    const list = new GiftList();
    list.owner = owner;
    list.type = ListType.PRIVATE_IDEAS;
    list.title = title;

    if (recipientUserId) {
      if (recipientUserId === session.userId) {
        return fail(t.errors.cannotLinkSelf);
      }
      const recipientUser = await em.findOne(User, { id: recipientUserId });
      if (!recipientUser) return fail(t.errors.userNotFound);
      list.recipientUser = recipientUser;
      list.recipientName = recipientName || recipientUser.username;
    } else {
      list.recipientName = recipientName;
    }

    em.persist(list);
    await em.flush();
    return ok({ id: list.id });
  });
}

export async function deletePrivateListAction(listId: string): Promise<ActionResult> {
  const session = await requireSession();

  return withORM(async () => {
    const list = await getOwnedList(listId, session.userId);
    if (!list) return fail(t.errors.listNotFound);
    if (list.type !== ListType.PRIVATE_IDEAS) return fail(t.errors.cannotDeleteList);

    const { getORM } = await import("@/lib/db");
    const em = (await getORM()).em.fork();
    const entity = await em.findOne(GiftList, { id: listId });
    if (!entity) return fail(t.errors.listNotFound);
    em.remove(entity);
    await em.flush();
    return ok();
  });
}

export async function addItemAction(
  listId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireSession();
  const name = (formData.get("name") as string)?.trim();
  const url = parseOptionalUrl(formData.get("url") as string);
  const price = parsePrice(formData.get("price") as string);

  if (!name) return fail(t.errors.itemNameRequired);

  return withORM(async () => {
    const list = await getOwnedList(listId, session.userId);
    if (!list) return fail(t.errors.listNotFound);

    const { getORM } = await import("@/lib/db");
    const em = (await getORM()).em.fork();
    const listEntity = await em.findOneOrFail(GiftList, { id: listId });

    const item = new GiftItem();
    item.list = listEntity;
    item.name = name;
    item.url = url;
    item.price = price;
    em.persist(item);
    await em.flush();
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/lists/${listId}`);
    revalidatePath(`/wishlist/${session.username}`);
    return ok();
  });
}

export async function deleteItemAction(itemId: string): Promise<ActionResult> {
  const session = await requireSession();

  return withORM(async () => {
    const { getORM } = await import("@/lib/db");
    const em = (await getORM()).em.fork();
    const item = await em.findOne(GiftItem, { id: itemId }, { populate: ["list.owner"] });
    if (!item || item.list.owner.id !== session.userId) {
      return fail(t.errors.itemNotFound);
    }
    em.remove(item);
    await em.flush();
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/lists/${item.list.id}`);
    revalidatePath(`/wishlist/${session.username}`);
    return ok();
  });
}

export async function updateWishlistTitleAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireSession();
  const title = (formData.get("title") as string)?.trim();
  if (!title) return fail(t.errors.titleRequired);

  return withORM(async () => {
    const { getORM } = await import("@/lib/db");
    const em = (await getORM()).em.fork();
    const list = await em.findOne(GiftList, {
      owner: session.userId,
      type: ListType.PUBLIC_WISHLIST,
    });
    if (!list) return fail(t.errors.wishlistNotFound);
    list.title = title;
    await em.flush();
    return ok();
  });
}

export interface PublicWishlistSummary {
  username: string;
  title: string;
  itemCount: number;
}

export async function getPublicWishlists(): Promise<PublicWishlistSummary[]> {
  return withORM(async () => {
    const { getORM } = await import("@/lib/db");
    const em = (await getORM()).em.fork();
    const lists = await em.find(
      GiftList,
      { type: ListType.PUBLIC_WISHLIST },
      { populate: ["owner", "items"] },
    );
    return lists.map((list) => ({
      username: list.owner.username,
      title: list.title,
      itemCount: list.items.length,
    }));
  });
}

export async function getPublicWishlistByUsername(username: string) {
  return withORM(async () => {
    const { getORM } = await import("@/lib/db");
    const em = (await getORM()).em.fork();
    const user = await em.findOne(User, { username: username.toLowerCase() });
    if (!user) return null;

    const list = await em.findOne(
      GiftList,
      { owner: user.id, type: ListType.PUBLIC_WISHLIST },
      { populate: ["items", "owner"] },
    );
    return list;
  });
}

export async function getDashboardData() {
  const session = await getSession();
  if (!session) redirect("/login");

  return withORM(async () => {
    const { getORM } = await import("@/lib/db");
    const em = (await getORM()).em.fork();

    const wishlist = await em.findOne(
      GiftList,
      { owner: session.userId, type: ListType.PUBLIC_WISHLIST },
      { populate: ["items"] },
    );

    const privateLists = await em.find(
      GiftList,
      { owner: session.userId, type: ListType.PRIVATE_IDEAS },
      { populate: ["items", "recipientUser"], orderBy: { updatedAt: "DESC" } },
    );

    return { session, wishlist, privateLists };
  });
}

export async function getPrivateList(listId: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  return withORM(async () => {
    const { getORM } = await import("@/lib/db");
    const em = (await getORM()).em.fork();
    const list = await em.findOne(
      GiftList,
      { id: listId, owner: session.userId, type: ListType.PRIVATE_IDEAS },
      { populate: ["items", "recipientUser"] },
    );
    if (!list) redirect("/dashboard");
    return { session, list };
  });
}
