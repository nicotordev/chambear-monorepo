import { Queue } from "bullmq";
import IORedis from "ioredis";
import { redisUrl, bullmqRedisOptions } from "./redis";

export const SCRAPE_QUEUE_NAME = "scrape-jobs";

const queueConnection = new IORedis(redisUrl, bullmqRedisOptions);

queueConnection.on("error", (err) => {
  console.error("❌ Scrape Queue Redis Error:", err);
});

export const scrapeQueue = new Queue(SCRAPE_QUEUE_NAME, {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

scrapeQueue.on("error", (err) => {
  console.error("❌ Scrape Queue Error:", err);
});
