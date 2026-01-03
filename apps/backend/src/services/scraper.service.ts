import pLimit from "p-limit";
import redisClient from "../lib/redis";
import aiActionService from "./ai-action.service";

class ScraperService {
  public async scrapeJobs() {
    try {
      // Find all scan keys
      const keys = await redisClient.keys("scan:*:*");
      if (keys.length === 0) return;

      console.info(`[ScraperService] Found ${keys.length} scan keys.`);

      // Concurrency limit for processing scans
      const limit = pLimit(5);

      await Promise.all(
        keys.map((key) =>
          limit(async () => {
            try {
              const parts = key.split(":");
              // Expected format: scan:userId:profileId
              if (parts.length !== 3) return;

              const [, userId, profileId] = parts;

              // Check status (only process 'pending')
              const status = await redisClient.get(key);
              if (status !== "pending") return;

              // Mark as processing to avoid race conditions
              await redisClient.set(key, "processing");

              console.info(
                `[ScraperService] Starting scan for profileId: ${profileId}`
              );

              // Delegate actual scraping/processing
              await aiActionService.scanJobs(profileId);

              // Mark as completed (expires in 1h)
              await redisClient.set(key, "completed", "EX", 3600);
              console.info(
                `[ScraperService] Completed scan for profileId: ${profileId}`
              );
            } catch (err: any) {
              console.error(
                `[ScraperService] Error processing key ${key}:`,
                err
              );
              // Mark as failed (expires in 1h)
              await redisClient.set(
                key,
                JSON.stringify({ status: "failed", error: err.message }),
                "EX",
                3600
              );
            }
          })
        )
      );
    } catch (e: any) {
      console.error("[ScraperService] CRITICAL ERROR:", e);
    }
  }
}

export default new ScraperService();
