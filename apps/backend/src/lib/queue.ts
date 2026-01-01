import { Queue } from "bullmq";
import connection from "./redis";

export const SCRAPE_QUEUE_NAME = "scrape-jobs";

export const scrapeQueue = new Queue(SCRAPE_QUEUE_NAME, {
  connection,
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
