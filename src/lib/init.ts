import { ensureSchema } from "@/lib/db";

let initPromise: Promise<void> | null = null;

export async function initApp(): Promise<void> {
  if (!initPromise) {
    initPromise = ensureSchema();
  }
  await initPromise;
}
