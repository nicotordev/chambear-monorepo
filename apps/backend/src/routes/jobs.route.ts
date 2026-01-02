import jobsController from "@/controllers/jobs.controller";
import { ApplicationSchema } from "@/schemas/application";
import { JobSchema, JobUpsertSchema } from "@/schemas/job";
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

const getFreeJobs = createRoute({
  method: "get",
  path: "/jobs/free",
  responses: {
    200: {
      description: "Get free jobs",
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

const applyJob = createRoute({
  method: "post",
  path: "/jobs/:id/apply",
  responses: {
    200: {
      description: "Apply to job",
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(ApplicationSchema),
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

const upsertJob = createRoute({
  method: "post",
  path: "/jobs",
  request: {
    body: {
      content: {
        "application/json": {
          schema: JobUpsertSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Upsert job",
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(JobSchema),
        },
      },
    },
    400: {
      description: "Bad Request",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});


const app = new OpenAPIHono();

app.openapi(getPublicJobs, jobsController.getPublicJobs);
app.openapi(getFreeJobs, jobsController.getFreeJobs);
app.openapi(getJobById, jobsController.getJobById);
app.openapi(applyJob, jobsController.applyJob);
app.openapi(upsertJob, jobsController.upsertJob);

export default app;
