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

    // TODO: Verify if the profile belongs to the user
    const jobs = await jobsService.scanJobs(profileId);

    return c.json(response.success([...jobs]), 200);
  },
};

export default jobsController;
