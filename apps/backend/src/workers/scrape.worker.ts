import { Worker, Queue, type Job } from "bullmq";
import IORedis from "ioredis";
import { SCRAPE_QUEUE_NAME } from "../lib/queue";
import { redisUrl, bullmqRedisOptions } from "../lib/redis";
import jobsService from "../services/jobs.service";

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
  stoppedBy: "drained" | "maxJobs" | "maxDuration" | "error";
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

type ProcessOpts = Readonly<{
  concurrency?: number;
  maxJobs?: number;
  maxDurationMs?: number;
  idleWaitMs?: number;
}>;

export const processScrapeQueue = async (
  opts?: ProcessOpts
): Promise<ProcessQueueResult> => {
  const concurrency = opts?.concurrency ?? 5;
  const maxJobs = opts?.maxJobs ?? 100;
  const maxDurationMs = opts?.maxDurationMs ?? 4 * 60_000; // 4 min
  const idleWaitMs = opts?.idleWaitMs ?? 1000;

  const started = Date.now();
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let stoppedBy: ProcessQueueResult["stoppedBy"] = "drained";

  // Isolated connections for this process run
  const workerConn = new IORedis(redisUrl, bullmqRedisOptions);
  const monitorConn = new IORedis(redisUrl, bullmqRedisOptions);

  workerConn.on("error", (err) => console.error("Worker Redis Error:", err));
  monitorConn.on("error", (err) => console.error("Monitor Redis Error:", err));

  const monitorQueue = new Queue(SCRAPE_QUEUE_NAME, { connection: monitorConn });

  const processor = async (job: Job<ScrapeJobData>) => {
    const { profileId } = job.data;
    console.log(`[Worker] Processing job ${job.id} for profile ${profileId}`);
    await jobsService.scanJobs(profileId);
    return { ok: true, profileId } as const;
  };

  const worker = new Worker<ScrapeJobData>(SCRAPE_QUEUE_NAME, processor, {
    connection: workerConn,
    concurrency,
    lockDuration: 60_000,
  });

  console.log(`[Worker] Started for queue ${SCRAPE_QUEUE_NAME}`);
  await sleep(2000); // Give it a moment to start

  const onCompleted = () => {
    succeeded += 1;
    processed += 1;
  };

  const onFailed = (job: Job<ScrapeJobData> | undefined, err: Error) => {
    console.error(`Job ${job?.id ?? "unknown"} failed:`, err);
    failed += 1;
    processed += 1;
  };

  worker.on("completed", onCompleted);
  worker.on("failed", onFailed);
  worker.on("error", (err) => console.error("Worker Error:", err));

  try {
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

      // Check if queue is empty using the monitor queue
      const counts = await monitorQueue.getJobCounts("wait", "active", "delayed", "prioritized", "completed", "failed");
      console.log(`[Worker Monitor] wait: ${counts.wait}, active: ${counts.active}, delayed: ${counts.delayed}, prioritized: ${counts.prioritized}, completed: ${counts.completed}, failed: ${counts.failed}`);
      
      if (counts.wait === 0 && counts.active === 0 && counts.prioritized === 0) {
        stoppedBy = "drained";
        break;
      }

      await sleep(idleWaitMs);
    }
  } catch (error) {
    console.error("Process Queue Loop Error:", error);
    stoppedBy = "error";
  } finally {
    worker.off("completed", onCompleted);
    worker.off("failed", onFailed);

    await Promise.allSettled([
      worker.close(),
      monitorQueue.close(),
      workerConn.quit(),
      monitorConn.quit(),
    ]);
  }

  return {
    processed,
    succeeded,
    failed,
    drained: stoppedBy === "drained",
    durationMs: Date.now() - started,
    stoppedBy,
  };
};
