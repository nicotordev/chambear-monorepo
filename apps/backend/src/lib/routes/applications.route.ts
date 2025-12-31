import {
  ApplicationSchema,
  ApplicationUpsertSchema,
  CreateInterviewSchema,
  InterviewSessionSchema,
} from "@/schemas/application";
import {
  createSuccessResponseSchema,
  ErrorResponseSchema,
} from "@/schemas/response";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import applicationsController from "@/controllers/applications.controller";

const app = new OpenAPIHono();

const getApplications = createRoute({
  method: "get",
  path: "/applications",
  request: {
    query: z.object({
      profileId: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(z.array(ApplicationSchema)),
        },
      },
      description: "Get all applications",
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
      description: "Internal Server Error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

const getApplicationById = createRoute({
  method: "get",
  path: "/applications/:id",
  request: {
    query: z.object({
      profileId: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(ApplicationSchema),
        },
      },
      description: "Get application by ID",
    },
    404: {
      description: "Not Found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

const upsertApplication = createRoute({
  method: "post",
  path: "/applications",
  request: {
    query: z.object({
      profileId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: ApplicationUpsertSchema.extend({ jobId: z.string() }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(ApplicationSchema),
        },
      },
      description: "Upsert application",
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
      description: "Internal Server Error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

const deleteApplication = createRoute({
  method: "delete",
  path: "/applications/:id",
  request: {
    query: z.object({
      profileId: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(
            z.object({ success: z.boolean() })
          ),
        },
      },
      description: "Delete application",
    },
    404: {
      description: "Not Found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

const createInterview = createRoute({
  method: "post",
  path: "/applications/:id/interview",
  request: {
    query: z.object({
      profileId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: CreateInterviewSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(InterviewSessionSchema),
        },
      },
      description: "Create interview session",
    },
    400: {
      description: "Bad Request",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

app.openapi(getApplications, applicationsController.getApplications);
app.openapi(getApplicationById, applicationsController.getApplicationById);
app.openapi(upsertApplication, applicationsController.upsertApplication);
app.openapi(deleteApplication, applicationsController.deleteApplication);
app.openapi(createInterview, applicationsController.createInterview);

export default app;
