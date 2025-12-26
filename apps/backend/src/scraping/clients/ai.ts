import { Pinecone } from "@pinecone-database/pinecone";
import { createHash } from "node:crypto";
import {
  PineconeJobsClientOptions,
  PineconeJobMetadata,
  PineconeJobVector,
  PineconeQueryMatch,
  JobPosting,
  EmbedFn,
  RetrievedJob,
} from "../../types/ai";
import { EmploymentType, WorkMode, Seniority } from "../../lib/generated";

type PineconeFilter = Readonly<Record<string, unknown>>;

const assertNonEmpty = (value: string | undefined, name: string): string => {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const isString = (v: unknown): v is string => typeof v === "string";
const isWorkMode = (v: unknown): v is WorkMode =>
  v === "remote" || v === "hybrid" || v === "on_site" || v === "unknown";

const isEmploymentType = (v: unknown): v is EmploymentType =>
  v === "full_time" ||
  v === "part_time" ||
  v === "contract" ||
  v === "internship" ||
  v === "temporary" ||
  v === "unknown";

const isSeniority = (v: unknown): v is Seniority =>
  v === "junior" ||
  v === "mid" ||
  v === "senior" ||
  v === "staff" ||
  v === "lead" ||
  v === "principal" ||
  v === "unknown";

const parsePineconeMetadata = (m: unknown): PineconeJobMetadata | undefined => {
  if (!isRecord(m)) return undefined;

  const title = m["title"];
  const sourceUrl = m["sourceUrl"];

  if (!isString(title) || !isString(sourceUrl)) return undefined;

  const remote = m["remote"];
  const employmentType = m["employmentType"];
  const seniority = m["seniority"];

  return {
    title,
    company: isString(m["company"]) ? m["company"] : undefined,
    location: isString(m["location"]) ? m["location"] : undefined,
    remote: isWorkMode(remote) ? remote : "UNKNOWN",
    employmentType: isEmploymentType(employmentType)
      ? employmentType
      : "UNKNOWN",
    seniority: isSeniority(seniority) ? seniority : "UNKNOWN",
    sourceUrl,
    applyUrl: isString(m["applyUrl"]) ? m["applyUrl"] : undefined,
  };
};

const clampInt = (n: number, min: number, max: number): number => {
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(Math.trunc(n), min), max);
};

const mapLimit = async <T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> => {
  const lim = clampInt(limit, 1, 64);
  const out: R[] = [];
  let i = 0;

  const workers = Array.from(
    { length: Math.min(lim, items.length) },
    async () => {
      while (i < items.length) {
        const idx = i;
        i += 1;
        const res = await fn(items[idx] as T, idx);
        out[idx] = res;
      }
    }
  );

  await Promise.all(workers);
  return out;
};

export class PineconeJobsClient {
  private readonly pc: Pinecone;
  private readonly indexName: string;
  private readonly namespace: string;

  public constructor(opts: PineconeJobsClientOptions = {}) {
    const apiKey = opts.indexName
      ? assertNonEmpty(process.env.PINECONE_API_KEY, "PINECONE_API_KEY")
      : assertNonEmpty(process.env.PINECONE_API_KEY, "PINECONE_API_KEY");

    this.pc = new Pinecone({ apiKey });

    this.indexName =
      opts.indexName ??
      assertNonEmpty(process.env.PINECONE_INDEX, "PINECONE_INDEX");

    // ✅ Correct fallback logic
    const envNs = process.env.PINECONE_NAMESPACE;
    this.namespace =
      opts.namespace ?? (envNs && envNs.trim().length > 0 ? envNs : "jobs-v1");
  }

  private index() {
    return this.pc
      .index<PineconeJobMetadata>(this.indexName)
      .namespace(this.namespace);
  }

  public async upsert(vectors: readonly PineconeJobVector[]): Promise<void> {
    if (vectors.length === 0) return;

    await this.index().upsert(
      vectors.map((v) => ({
        id: v.id,
        values: Array.from(v.values),
        metadata: v.metadata ? { ...v.metadata } : undefined,
      }))
    );
  }

  public async query(
    params: Readonly<{
      vector: readonly number[];
      topK: number;
      filter?: PineconeFilter;
      includeMetadata?: boolean;
    }>
  ): Promise<readonly PineconeQueryMatch[]> {
    const topK = clampInt(params.topK, 1, 10_000);

    const res = await this.index().query({
      vector: Array.from(params.vector),
      topK,
      filter: params.filter ? { ...params.filter } : undefined,
      includeMetadata: params.includeMetadata ?? true,
    });

    const matches = res.matches ?? [];
    const out: PineconeQueryMatch[] = [];

    for (const m of matches) {
      if (!m) continue;
      if (!isString(m.id)) continue;
      if (typeof m.score !== "number") continue;

      out.push({
        id: m.id,
        score: m.score,
        metadata: parsePineconeMetadata(m.metadata),
      });
    }

    return out;
  }

  public async indexJobsToPinecone(
    params: Readonly<{
      jobs: readonly JobPosting[];
      embed: EmbedFn;
      concurrency?: number; // default 4
    }>
  ): Promise<void> {
    const jobs = params.jobs.filter((j) => j.sourceUrl.trim().length > 0);
    if (jobs.length === 0) return;

    const concurrency = params.concurrency ?? 4;

    const vectors = await mapLimit(jobs, concurrency, async (job) => {
      const id = this.jobStableId({
        sourceUrl: job.sourceUrl,
        applyUrl: job.applyUrl,
        title: job.title,
      });

      const text = this.jobToEmbeddingText(job);
      const values = await params.embed(text);

      const vector: PineconeJobVector = {
        id,
        values,
        metadata: {
          title: job.title,
          company: job.company,
          location: job.location,
          remote: job.remote ?? "UNKNOWN",
          employmentType: job.employmentType ?? "UNKNOWN",
          seniority: job.seniority ?? "UNKNOWN",
          sourceUrl: job.sourceUrl,
          applyUrl: job.applyUrl,
        },
      };

      return vector;
    });

    await this.upsert(vectors);
  }

  public async retrieveRelevantJobs(
    params: Readonly<{
      jobs: readonly JobPosting[];
      userContext: string;
      embed: EmbedFn;
      topK?: number;
      filter?: PineconeFilter;
    }>
  ): Promise<readonly RetrievedJob[]> {
    const jobs = params.jobs.filter((j) => j.sourceUrl.trim().length > 0);
    if (jobs.length === 0) return [];

    const requestedTopK = params.topK ?? 50;
    const topK = clampInt(Math.min(requestedTopK, jobs.length), 1, jobs.length);

    const byId = new Map<string, JobPosting>();
    for (const job of jobs) {
      const id = this.jobStableId({
        sourceUrl: job.sourceUrl,
        applyUrl: job.applyUrl,
        title: job.title,
      });
      byId.set(id, job);
    }

    const queryVector = await params.embed(params.userContext);

    const matches = await this.query({
      vector: queryVector,
      topK,
      filter: params.filter,
      includeMetadata: true,
    });

    const out: RetrievedJob[] = [];
    for (const m of matches) {
      const job = byId.get(m.id);
      if (!job) continue;
      out.push({ job, retrievalScore: m.score });
    }

    return out;
  }

  private renderList(items?: readonly string[]): string {
    if (!items || items.length === 0) return "";
    return `- ${items.join("\n- ")}`;
  }

  public jobToEmbeddingText(job: JobPosting): string {
    return `
Title: ${job.title}
Company: ${job.company ?? ""}
Location: ${job.location ?? ""}
Remote: ${job.remote ?? "unknown"}
EmploymentType: ${job.employmentType ?? "unknown"}
Seniority: ${job.seniority ?? "unknown"}
Team: ${job.team ?? ""}

Responsibilities:
${this.renderList(job.responsibilities)}

Requirements:
${this.renderList(job.requirements)}

NiceToHave:
${this.renderList(job.niceToHave)}

Compensation: ${job.compensation ?? ""}

ApplyUrl: ${job.applyUrl ?? ""}
SourceUrl: ${job.sourceUrl}

DescriptionMarkdown:
${job.descriptionMarkdown ?? ""}
`.trim();
  }

  public jobStableId(
    job: Readonly<{
      sourceUrl: string;
      applyUrl?: string;
      title: string;
    }>
  ): string {
    const base = `${job.sourceUrl}::${job.applyUrl ?? ""}::${job.title}`;
    return createHash("sha256").update(base, "utf8").digest("hex");
  }
}
