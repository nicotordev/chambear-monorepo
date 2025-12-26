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

export class PineconeJobsClient {
  private readonly pc: Pinecone;
  private readonly indexName: string;
  private readonly namespace: string;

  public constructor(opts: PineconeJobsClientOptions = {}) {
    this.pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    this.indexName = opts.indexName ?? process.env.PINECONE_INDEX!;
    this.namespace =
      opts.namespace ?? process.env.PINECONE_NAMESPACE! ?? "jobs-v1";
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
        values: [...v.values],
        metadata: v.metadata ? { ...v.metadata } : undefined,
      }))
    );
  }

  public async query(
    params: Readonly<{
      vector: readonly number[];
      topK: number;
      filter?: Readonly<Record<string, unknown>>;
      includeMetadata?: boolean;
    }>
  ): Promise<readonly PineconeQueryMatch[]> {
    const res = await this.index().query({
      vector: [...params.vector],
      topK: params.topK,
      filter: params.filter ? { ...params.filter } : undefined,
      includeMetadata: params.includeMetadata ?? true,
    });

    const matches = res.matches ?? [];
    const out: PineconeQueryMatch[] = [];

    for (const m of matches) {
      if (typeof m.id !== "string") continue;
      if (typeof m.score !== "number") continue;
      out.push({
        id: m.id,
        score: m.score,
        metadata: m.metadata
          ? { ...(m.metadata as PineconeJobMetadata) }
          : undefined,
      });
    }

    return out;
  }

  public async indexJobsToPinecone(
    params: Readonly<{
      jobs: readonly JobPosting[];
      embed: EmbedFn;
    }>
  ): Promise<void> {
    const vectors: PineconeJobVector[] = [];

    for (const job of params.jobs) {
      const id = this.jobStableId({
        sourceUrl: job.sourceUrl,
        applyUrl: job.applyUrl,
        title: job.title,
      });
      const text = this.jobToEmbeddingText(job);
      const values = await params.embed(text);

      vectors.push({
        id,
        values,
        metadata: {
          title: job.title,
          company: job.company,
          location: job.location,
          remote: job.remote ?? "unknown",
          employmentType: job.employmentType ?? "unknown",
          seniority: job.seniority ?? "unknown",
          sourceUrl: job.sourceUrl,
          applyUrl: job.applyUrl,
        },
      });
    }

    await this.upsert(vectors);
  }

  public async retrieveRelevantJobs(
    params: Readonly<{
      jobs: readonly JobPosting[];
      userContext: string;
      embed: EmbedFn;
      topK?: number;
      filter?: Readonly<Record<string, unknown>>;
    }>,
    pinecone?: PineconeJobsClient
  ): Promise<readonly RetrievedJob[]> {
    const pineconeClient = pinecone ?? this;
    const rawTopK = params.topK ?? 50;
    const topK = Math.min(Math.max(rawTopK, 1), params.jobs.length);
    if (topK === 0) return [];

    const byId = new Map<string, JobPosting>();
    for (const job of params.jobs) {
      const id = this.jobStableId({
        sourceUrl: job.sourceUrl,
        applyUrl: job.applyUrl,
        title: job.title,
      });
      byId.set(id, job);
    }

    const queryVector = await params.embed(params.userContext);

    const matches = await pineconeClient.query({
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
