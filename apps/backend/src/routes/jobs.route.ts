import jobsController from "@/controllers/jobs.controller";
import { JobSchema, RankedJobSchema } from "@/schemas/job";
import {
  createSuccessResponseSchema,
  ErrorResponseSchema,
} from "@/schemas/response";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

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

const scanJobs = createRoute({
  method: "get",
  path: "/jobs/scan",
  request: {
    query: z.object({
      profileId: z.string(),
    }),
  },
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
    400: {
      description: "Bad Request",
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
app.openapi(scanJobs, jobsController.scanJobs);

export default app;
