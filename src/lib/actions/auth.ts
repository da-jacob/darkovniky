"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { GiftList, ListType, User } from "@/entities";
import { createSession, destroySession, getSession } from "@/lib/auth";
import { withORM } from "@/lib/db";
import { t } from "@/lib/i18n";
import { fail, ok, type ActionResult } from "@/lib/utils";

export async function registerAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const username = (formData.get("username") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!username || username.length < 3) {
    return fail(t.errors.usernameMin);
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return fail(t.errors.usernameChars);
  }
  if (!password || password.length < 6) {
    return fail(t.errors.passwordMin);
  }
  if (password !== confirmPassword) {
    return fail(t.errors.passwordsMismatch);
  }

  return withORM(async () => {
    const { getORM } = await import("@/lib/db");
    const em = (await getORM()).em.fork();

    const existing = await em.findOne(User, { username });
    if (existing) {
      return fail(t.errors.usernameTaken);
    }

    const user = new User();
    user.username = username;
    user.passwordHash = await bcrypt.hash(password, 12);

    const wishlist = new GiftList();
    wishlist.owner = user;
    wishlist.type = ListType.PUBLIC_WISHLIST;
    wishlist.title = t.wishlistTitle(username);

    em.persist([user, wishlist]);
    await em.flush();

    await createSession({ userId: user.id, username: user.username });
    redirect("/dashboard");
  });
}

export async function loginAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const username = (formData.get("username") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!username || !password) {
    return fail(t.errors.credentialsRequired);
  }

  return withORM(async () => {
    const { getORM } = await import("@/lib/db");
    const em = (await getORM()).em.fork();

    const user = await em.findOne(User, { username });
    if (!user) {
      return fail(t.errors.invalidCredentials);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return fail(t.errors.invalidCredentials);
    }

    await createSession({ userId: user.id, username: user.username });
    redirect("/dashboard");
  });
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  return withORM(async () => {
    const { getORM } = await import("@/lib/db");
    const em = (await getORM()).em.fork();
    return em.findOne(User, { id: session.userId });
  });
}
