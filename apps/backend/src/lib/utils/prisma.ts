import { Prisma } from "../generated";

/**
 * Converts a value to a Prisma-compatible JSON value, handling circular references
 * and ensuring finite numbers.
 */
export const toPrismaJsonValue = (
  value: unknown
): Prisma.InputJsonValue | typeof Prisma.JsonNull => {
  const seen = new Set<unknown>();

  const normalize = (v: unknown): Prisma.InputJsonValue | null => {
    if (v === null) return null;
    if (typeof v === "string") return v;
    if (typeof v === "number") return Number.isFinite(v) ? v : String(v);
    if (typeof v === "boolean") return v;

    if (Array.isArray(v)) return v.map((x) => normalize(x));

    if (typeof v === "object") {
      if (seen.has(v)) return "[Circular]";
      seen.add(v);

      const obj = v as Record<string, unknown>;
      const out: Record<string, Prisma.InputJsonValue | null> = {};
      for (const [k, val] of Object.entries(obj)) out[k] = normalize(val);
      return out;
    }

    return String(v);
  };

  const result = normalize(value);
  return result === null ? Prisma.JsonNull : result;
};
