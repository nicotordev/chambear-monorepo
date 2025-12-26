import type { Context, Env } from "hono";
import { getAuth } from "@hono/clerk-auth";
import jobsService from "@/services/jobs.service";
import response from "@/lib/utils/response";

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

  async getJobRecommendations(c: Context) {
    const auth = getAuth(c);
    const userId = auth?.userId;
    
    if (!userId) {
      return c.json(response.unauthorized(), 401);
    }

    const jobs = await jobsService.getRecommendedJobs(userId);

    return c.json(response.success([...jobs]), 200);
  },
};

export default jobsController;
