import { Queue, Job, type JobsOptions } from "bullmq";
import IORedis from "ioredis";
import { SCRAPE_QUEUE_NAME } from "../lib/queue";
import { redisUrl, bullmqRedisOptions } from "../lib/redis";
import aiActionService from "@/services/ai-action.service";
export interface ScrapeJobData {
  profileId: string;
  userId: string;
}

export interface ProcessQueueResult {
  processed: number;
  succeeded: number;
  failed: number;
  drained: boolean;
  durationMs: number;
  stoppedBy: "drained" | "maxJobs" | "maxDuration" | "error" | "locked";
}

type ProcessOpts = Readonly<{
  concurrency?: number;
  maxJobs?: number;
  maxDurationMs?: number;
  idleWaitMs?: number;
  /**
   * Whether to also process prioritized jobs.
   * (BullMQ can keep prioritized in a separate list depending on version/config)
   */
  includePrioritized?: boolean;
  /**
   * Whether to process delayed jobs that are due.
   * If true, we call queue.promoteJobs() each tick.
   */
  promoteDueDelayed?: boolean;

  /**
   * Optional: ensure only one drain runs at a time (recommended in prod if multiple instances can call this).
   */
  enableRunLock?: boolean;
  runLockKey?: string;
  runLockTtlMs?: number;
}>;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Simple Redis lock: SET key value NX PX ttl
 */
const acquireLock = async (
  redis: IORedis,
  key: string,
  ttlMs: number
): Promise<string | null> => {
  const token = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const ok = await redis.set(key, token, "PX", ttlMs, "NX");
  return ok === "OK" ? token : null;
};

const releaseLock = async (
  redis: IORedis,
  key: string,
  token: string
): Promise<void> => {
  // Lua: release only if token matches
  const script = `
    if redis.call("GET", KEYS[1]) == ARGV[1] then
      return redis.call("DEL", KEYS[1])
    else
      return 0
    end
  `;
  await redis.eval(script, 1, key, token);
};

type JobStateToFetch = "wait" | "prioritized" | "active";

/**
 * Process jobs directly without Worker.
 * This is best for "run-on-demand" cron/webhook triggers.
 */
export const processScrapeQueueDirect = async (
  opts?: ProcessOpts
): Promise<ProcessQueueResult> => {
  const concurrency = opts?.concurrency ?? 5;
  const maxJobs = opts?.maxJobs ?? 100;
  const maxDurationMs = opts?.maxDurationMs ?? 4 * 60_000;
  const idleWaitMs = opts?.idleWaitMs ?? 750;
  const includePrioritized = opts?.includePrioritized ?? true;
  const promoteDueDelayed = opts?.promoteDueDelayed ?? true;

  const enableRunLock = opts?.enableRunLock ?? true;
  const runLockKey = opts?.runLockKey ?? `${SCRAPE_QUEUE_NAME}:drain:lock`;
  const runLockTtlMs = opts?.runLockTtlMs ?? maxDurationMs + 30_000;

  const started = Date.now();

  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let stoppedBy: ProcessQueueResult["stoppedBy"] = "drained";

  // One connection is enough for Queue + jobs
  const conn = new IORedis(redisUrl, bullmqRedisOptions);
  conn.on("error", (err) => console.error("Redis Error:", err));

  const queue = new Queue<ScrapeJobData>(SCRAPE_QUEUE_NAME, {
    connection: conn,
  });

  let lockToken: string | null = null;

  try {
    if (enableRunLock) {
      lockToken = await acquireLock(conn, runLockKey, runLockTtlMs);
      if (!lockToken) {
        return {
          processed: 0,
          succeeded: 0,
          failed: 0,
          drained: false,
          durationMs: Date.now() - started,
          stoppedBy: "locked",
        };
      }
    }

    // Local in-flight set to avoid double-processing in our own loop
    const inFlight = new Set<string>();

    const runOne = async (job: Job<ScrapeJobData>): Promise<void> => {
      const id = job.id?.toString() ?? "";
      if (!id || inFlight.has(id)) return;
      inFlight.add(id);

      try {
        const { profileId } = job.data;
        await aiActionService.scanJobs(profileId);

        // Mark completed in BullMQ
        // moveToCompleted expects a return value and a token (for locks) in worker context,
        // but BullMQ allows completing without a token when not locked in some flows.
        // Safer: use job.updateProgress + job.moveToCompleted with a null token isn't allowed in older versions.
        // Alternative: just remove job after success to "drain" queue safely.
        // We'll do a robust approach: remove on success and keep audit via logs.
        await job.remove();

        succeeded += 1;
      } catch (err) {
        failed += 1;

        const e = err instanceof Error ? err : new Error(String(err));
        console.error(`Job ${job.id?.toString() ?? "unknown"} failed:`, e);

        // Move to failed if possible; otherwise keep it for retry logic
        // If you use attempts/backoff, leaving it is okay.
        try {
          // Prefer marking failed when supported; fallback to not removing.
          await job.moveToFailed(e, "0", false);
        } catch {
          // noop: keep the job; BullMQ will retry if attempts is configured
        }
      } finally {
        processed += 1;
        inFlight.delete(id);
      }
    };

    while (true) {
      const elapsed = Date.now() - started;
      if (elapsed >= maxDurationMs) {
        stoppedBy = "maxDuration";
        break;
      }
      if (processed >= maxJobs) {
        stoppedBy = "maxJobs";
        break;
      }

      if (promoteDueDelayed) {
        // Promote delayed jobs that are due (best-effort)
        try {
          await queue.promoteJobs();
        } catch {
          // Not all BullMQ versions/configs support this cleanly; ignore.
        }
      }

      // Check queue counts first
      const counts = await queue.getJobCounts(
        "wait",
        "active",
        "delayed",
        "prioritized"
      );

      const waitEmpty = (counts.wait ?? 0) === 0;
      const activeEmpty = (counts.active ?? 0) === 0;
      const prioritizedEmpty = (counts.prioritized ?? 0) === 0;

      const shouldTreatAsDrained = includePrioritized
        ? waitEmpty && activeEmpty && prioritizedEmpty
        : waitEmpty && activeEmpty;

      if (shouldTreatAsDrained) {
        stoppedBy = "drained";
        break;
      }

      // Fetch a batch of jobs (wait + prioritized)
      const states: JobStateToFetch[] = includePrioritized
        ? ["prioritized", "wait"]
        : ["wait"];

      // Pull slightly more than concurrency to keep the pipeline full
      const batchSize = Math.max(concurrency * 2, 10);

      const jobs = await queue.getJobs(
        states,
        0,
        batchSize - 1,
        true // asc
      );

      if (jobs.length === 0) {
        await sleep(idleWaitMs);
        continue;
      }

      // Process in parallel with a simple concurrency limiter
      let idx = 0;
      const workers: Promise<void>[] = Array.from(
        { length: concurrency },
        async () => {
          while (true) {
            const j = jobs[idx];
            idx += 1;
            if (!j) break;
            if (processed >= maxJobs) break;
            await runOne(j);
          }
        }
      );

      await Promise.all(workers);

      // Small pause to avoid hammering Redis
      await sleep(25);
    }
  } catch (error) {
    console.error("Direct Queue Loop Error:", error);
    stoppedBy = "error";
  } finally {
    if (enableRunLock && lockToken) {
      try {
        await releaseLock(conn, runLockKey, lockToken);
      } catch {
        // ignore
      }
    }

    await Promise.allSettled([queue.close(), conn.quit()]);
  }

  // We consider drained only if we stopped by drained
  return {
    processed,
    succeeded,
    failed,
    drained: stoppedBy === "drained",
    durationMs: Date.now() - started,
    stoppedBy,
  };
};
