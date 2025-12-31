import { createHash } from "node:crypto";
import type { JobPosting } from "../../types/ai";

type CanonicalizedJob = Readonly<{
  job: JobPosting;
  canonicalKey: string;
}>;

const normalizeText = (s: string): string =>
  s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s\-_/().:@]/gu, "");

const normalizeUrlSafe = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    const u = new URL(trimmed);
    const drop = new Set([
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "ref",
      "source",
      "gh_src",
    ]);
    for (const k of Array.from(u.searchParams.keys())) {
      if (drop.has(k)) u.searchParams.delete(k);
    }
    u.hash = "";
    return u.toString();
  } catch {
    return trimmed;
  }
};

const hashSig = (s: string): string =>
  createHash("sha256").update(s, "utf8").digest("hex").slice(0, 24);

export const canonicalizeJobs = (
  jobs: readonly JobPosting[]
): CanonicalizedJob[] => {
  const out: CanonicalizedJob[] = [];

  for (const j of jobs) {
    const url = normalizeUrlSafe(j.sourceUrl ?? "");
    const title = normalizeText(j.title ?? "");
    const company = normalizeText(j.company ?? "");
    const location = normalizeText(j.location ?? "");

    const canonicalKey =
      url.length > 0
        ? `url:${url}`
        : `sig:${hashSig([company, title, location].join("|"))}`;

    out.push({
      job: {
        ...j,
        sourceUrl: url.length > 0 ? url : j.sourceUrl ?? "",
      },
      canonicalKey,
    });
  }

  return out;
};

export const dedupeCanonicalJobs = (
  jobs: readonly CanonicalizedJob[]
): CanonicalizedJob[] => {
  const seen = new Set<string>();
  const kept: CanonicalizedJob[] = [];
  for (const j of jobs) {
    if (seen.has(j.canonicalKey)) continue;
    seen.add(j.canonicalKey);
    kept.push(j);
  }
  return kept;
};
