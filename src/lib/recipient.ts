export function getRecipientLabel(list: {
  recipientName?: string | null;
  recipientUser?: { username: string } | null;
}): string {
  if (list.recipientUser) {
    return `@${list.recipientUser.username}`;
  }
  return list.recipientName ?? "";
}

export function getRecipientUsername(list: {
  recipientUser?: { username: string } | null;
}): string | undefined {
  return list.recipientUser?.username;
}
