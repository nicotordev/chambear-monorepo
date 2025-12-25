import type { Context, Env } from "hono";
import jobsService from "@/services/jobs.service";

const jobsController = {
  async getPublicJobs(c: Context<Env, "/jobs", {}>) {
    const jobs = await jobsService.getPublicJobs();
    return c.json(jobs, 200);
  },
};

export default jobsController;
