/* =========================
 * Small utilities (strict)
 * ========================= */

export const assertNonEmpty = (
  value: string | undefined,
  name: string
): string => {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
};

export const mapLimit = async <T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> => {
  const lim = Math.max(1, Math.min(32, Math.trunc(limit)));
  const out: R[] = new Array(items.length);
  let i = 0;

  const workers = Array.from(
    { length: Math.min(lim, items.length) },
    async () => {
      while (i < items.length) {
        const idx = i;
        i += 1;
        out[idx] = await fn(items[idx] as T, idx);
      }
    }
  );

  await Promise.all(workers);
  return out;
};

export const normalizeUrl = (u: string): string => u.trim();
