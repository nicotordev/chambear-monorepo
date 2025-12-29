import response from "@/lib/utils/response";
import jobsService from "@/services/jobs.service";
import { getAuth } from "@hono/clerk-auth";
import type { Context } from "hono";

const jobsController = {
  async getPublicJobs(c: Context) {
    const jobs = await jobsService.getPublicJobs();

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
    const userId = auth?.userId;

    if (!userId) {
      return c.json(response.unauthorized(), 401);
    }

    const profileId = c.req.query("profileId");
    if (!profileId) {
      return c.json(response.badRequest("Profile ID is required"), 400);
    }

    const jobs = await jobsService.scanJobs(profileId);

    return c.json(response.success([...jobs]), 200);
  },

  async applyJob(c: Context) {
    const auth = getAuth(c);
    const userId = auth?.userId;

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
