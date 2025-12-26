import jobsController from "@/controllers/jobs.controller";
import { JobSchema, RankedJobSchema } from "@/schemas/job";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute, z } from "@hono/zod-openapi";
import {
  createSuccessResponseSchema,
  ErrorResponseSchema,
} from "@/schemas/response";

const getPublicJobs = createRoute({
  method: "get",
  path: "/jobs",
  responses: {
    200: {
      description: "Get public jobs",
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(z.array(JobSchema)),
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

const getJobById = createRoute({
  method: "get",
  path: "/jobs/:id",
  responses: {
    200: {
      description: "Get job by id",
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(JobSchema),
        },
      },
    },
    404: {
      description: "Job not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

const getJobRecommendations = createRoute({
  method: "get",
  path: "/jobs/recommendations",
  responses: {
    200: {
      description: "Get job recommendations",
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(z.array(RankedJobSchema)),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

const app = new OpenAPIHono();

app.openapi(getPublicJobs, jobsController.getPublicJobs);
app.openapi(getJobById, jobsController.getJobById);
app.openapi(getJobRecommendations, jobsController.getJobRecommendations);

export default app;
