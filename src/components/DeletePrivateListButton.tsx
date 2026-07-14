"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { deletePrivateListAction } from "@/lib/actions/lists";
import { t } from "@/lib/i18n";

export function DeletePrivateListButton({ listId }: { listId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(t.privateList.deleteConfirm)) return;
    const result = await deletePrivateListAction(listId);
    if (result.success) {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <Button type="button" variant="danger" onClick={handleDelete}>
      {t.privateList.deleteList}
    </Button>
  );
}
