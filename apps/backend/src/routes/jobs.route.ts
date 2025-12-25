import jobsController from "@/controllers/jobs.controller";
import { JobSchema } from "@/schemas/job";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute, z } from "@hono/zod-openapi";

const getPublicJobs = createRoute({
  method: "get",
  path: "/jobs",
  responses: {
    200: {
      description: "Get public jobs",
      content: {
        "application/json": {
          schema: z.array(JobSchema),
        },
      },
    },
  },
});

const registerJobsRoutes = (app: OpenAPIHono) => {
  app.openapi(getPublicJobs, jobsController.getPublicJobs);
};

const jobsRoutes = { registerJobsRoutes };

export default jobsRoutes;
