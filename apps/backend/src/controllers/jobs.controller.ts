import { scrapeQueue } from "@/lib/queue";
import response from "@/lib/utils/response";
import billingService from "@/services/billing.service";
import jobsService from "@/services/jobs.service";
import { getAuth } from "@hono/clerk-auth";
import type { Context } from "hono";

const jobsController = {
  async getPublicJobs(c: Context) {
    const search = c.req.query("search");
    const jobs = await jobsService.getPublicJobs(search);

    return c.json(response.success(jobs), 200);
  },

  async getFreeJobs(c: Context) {
    const jobs = await jobsService.getFreeJobs();

    return c.json(response.success(jobs), 200);
  },

  async getJob(c: Context) {
    const job = await jobsService.getJob(c.req.param("id"));

    if (!job) {
      return c.json(response.notFound("Job not found"), 404);
    }

    return c.json(response.success(job), 200);
  },

  async getJobById(c: Context) {
    const job = await jobsService.getJob(c.req.param("id"));

    if (!job) {
      return c.json(response.notFound("Job not found"), 404);
    }

    return c.json(response.success(job), 200);
  },

  async scanJobs(c: Context) {
    const auth = getAuth(c);
    const userId: string | undefined | null = auth?.userId;

    if (!userId) {
      return c.json(response.unauthorized(), 401);
    }

    const profileId = c.req.query("profileId");
    if (!profileId) {
      console.warn(`[scanJobs] Missing profileId for user ${userId}`);
      return c.json(response.badRequest("Profile ID is required"), 400);
    }

    console.log(`[scanJobs] Checking credits for user ${userId}`);
    const canScan = await billingService.canUserAction(userId, "JOB_SCAN");
    if (!canScan) {
      console.warn(`[scanJobs] User ${userId} has insufficient credits`);
      return c.json(
        response.error({
          message: "Insufficient credits or no active subscription",
          status: 402,
        }),
        402
      );
    }

    const payload = { profileId, userId };
    const jobId = `scan:${userId}:${profileId}`;

    console.log(`[scanJobs] Adding job ${jobId} to queue`);
    try {
      const existingJob = await scrapeQueue.getJob(jobId);
      if (existingJob) {
        console.log(`[scanJobs] Removing existing job ${jobId}`);
        await existingJob.remove();
      }

      await scrapeQueue.add("scan-jobs", payload, {
        jobId,
        removeOnComplete: { age: 60 * 60, count: 1000 },
        removeOnFail: { age: 24 * 60 * 60, count: 1000 },
        attempts: 3,
        backoff: { type: "exponential", delay: 10_000 },
      });
      console.log(`[scanJobs] Job ${jobId} added successfully`);
    } catch (err) {
      console.error(`[scanJobs] Failed to add job to queue:`, err);
      return c.json(response.error("Failed to schedule scan"), 500);
    }

    await billingService.consumeCredits(userId, "JOB_SCAN");

    return c.json(response.success({ message: "Scan scheduled", jobId }), 200);
  },

  async applyJob(c: Context) {
    const auth = getAuth(c);
    const userId: string | undefined | null = auth?.userId;

    if (!userId) {
      return c.json(response.unauthorized(), 401);
    }

    const jobId = c.req.param("id");
    if (!jobId) {
      return c.json(response.badRequest("Job ID is required"), 400);
    }

    const job = await jobsService.applyJob(jobId, userId);

    return c.json(response.success(job), 200);
  },

  async getScanStatus(c: Context) {
    const auth = getAuth(c);
    const userId = auth?.userId;

    if (!userId) {
      return c.json(response.unauthorized(), 401);
    }

    const profileId = c.req.query("profileId");
    if (!profileId) {
      return c.json(response.badRequest("Profile ID is required"), 400);
    }

    const jobId = `scan:${userId}:${profileId}`;
    const job = await scrapeQueue.getJob(jobId);

    if (!job) {
      return c.json(response.success({ status: "idle" }), 200);
    }

    const state = await job.getState();
    return c.json(response.success({ status: state, jobId }), 200);
  },

  async upsertJob(c: Context) {
    const auth = getAuth(c);
    const userId = auth?.userId;

    if (!userId) {
      return c.json(response.unauthorized(), 401);
    }

    try {
      const body = await c.req.json();
      const job = await jobsService.upsertJob(body);
      return c.json(response.success(job), 200);
    } catch (error) {
      console.error(error);
      return c.json(response.error("Failed to upsert job"), 500);
    }
  },
};

export default jobsController;
