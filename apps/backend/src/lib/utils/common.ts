import type { RetryOptions } from "@/types/ai";

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function chunk<T>(arr: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function clamp(n: number, min: number, max: number): number {
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

export function isRetryable(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const m = err.message.toLowerCase();
  return (
    m.includes("timeout") ||
    m.includes("timed out") ||
    m.includes("rate limit") ||
    m.includes("429") ||
    m.includes("502") ||
    m.includes("503") ||
    m.includes("500") ||
    m.includes("connection") ||
    m.includes("network")
  );
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions
): Promise<T> {
  let last: unknown = undefined;
  for (let i = 0; i <= opts.maxRetries; i += 1) {
    try {
      return await fn();
    } catch (e: unknown) {
      last = e;
      const canRetry = i < opts.maxRetries && isRetryable(e);
      if (!canRetry) throw e;
      const delay = Math.round(opts.retryBaseDelayMs * Math.pow(2, i));
      await sleep(delay);
    }
  }
  throw last instanceof Error ? last : new Error("Unknown error after retries");
}

export function uniqueStrings(values: readonly string[]): string[] {
  return Array.from(new Set(values));
}

export function sortByScoreDesc<T extends { score: number }>(
  items: readonly T[]
): T[] {
  return [...items].sort((a, b) => b.score - a.score);
}

export function uniqueBy<T>(items: readonly T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}
