import type { Context, Env } from "hono";
import jobsService from "@/services/jobs.service";
import type { JobPosting } from "@/types/ai";

const jobsController = {
  async getPublicJobs(c: Context<Env, "/jobs", {}>) {
    const jobs = await jobsService.getPublicJobs();

    return c.json(jobs, 200);
  },

  async getJob(
    c: Context<
      Env,
      "/jobs/:id",
      { in: { id: string }; out: { 200: { body: JobPosting } } }
    >
  ) {
    const job = await jobsService.getJob(c.req.param("id"));

    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }

    return c.json(job, 200);
  },
};

export default jobsController;
