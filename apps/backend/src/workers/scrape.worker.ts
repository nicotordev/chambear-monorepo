import { Worker, type Job } from "bullmq";
import connection from "../lib/redis";
import { SCRAPE_QUEUE_NAME, scrapeQueue } from "../lib/queue";
import jobsService from "../services/jobs.service";

export interface ScrapeJobData {
  profileId: string;
  userId: string;
}

let isProcessing = false;

/**
 * Processes jobs from the queue until empty or a timeout is reached.
 * Intended to be called by a CRON webhook.
 */
export const processScrapeQueue = async () => {
  if (isProcessing) {
    console.log("[Worker] Already processing a batch. Skipping.");
    return;
  }

  const counts = await scrapeQueue.getJobCounts("wait", "active");
  if (counts.wait === 0 && counts.active === 0) {
    console.log("[Worker] No jobs waiting or active. Skipping.");
    return;
  }

  isProcessing = true;
  console.log("[Worker] Starting batch processing...");
  
  return new Promise<void>((resolve, reject) => {
    const worker = new Worker<ScrapeJobData>(
      SCRAPE_QUEUE_NAME,
      async (job: Job<ScrapeJobData>) => {
        const { profileId, userId } = job.data;
        console.log(`[Worker] Processing job ${job.id} for profile: ${profileId}`);
        await jobsService.scanJobs(profileId);
      },
      {
        connection,
        concurrency: 5,
        // We want this worker to close after it's idle for a bit
        // But specifically for this "serverless" style, we'll manually manage lifecycle below
      }
    );

    const cleanup = async () => {
      isProcessing = false;
      await worker.close();
      resolve();
    };

    worker.on("completed", (job) => {
      console.log(`[Worker] Job ${job.id} completed`);
    });

    worker.on("failed", (job, err) => {
      console.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
    });

    // Strategy: Listen for 'drained' event to know when queue is empty.
    // However, if new jobs are added *during* processing, 'drained' fires when locally empty.
    worker.on("drained", async () => {
      console.log("[Worker] Queue drained. Closing worker...");
      await cleanup();
    });

    // Safety timeout: 5 minutes (matches the cron interval roughly)
    // If it takes longer, we kill it so the next cron run can pick up.
    setTimeout(async () => {
      console.warn("[Worker] Timeout reached. Closing worker...");
      await cleanup();
    }, 4 * 60 * 1000); // 4 minutes
  });
};