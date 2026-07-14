export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export function ok<T>(data?: T): ActionResult<T> {
  return { success: true, data };
}

export function fail(error: string): ActionResult<never> {
  return { success: false, error };
}

export function parsePrice(value: string | null | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  const num = Number(value);
  if (Number.isNaN(num) || num < 0) return undefined;
  return num.toFixed(2);
}

export function parseOptionalUrl(value: string | null | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}
