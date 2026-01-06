import jobPreferenceController from "@/controllers/job-preference.controller";
import {
  JobPreferenceSchema,
  JobPreferenceUpsertSchema,
} from "@/schemas/job-preference";
import {
  createSuccessResponseSchema,
  ErrorResponseSchema,
} from "@/schemas/response";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

const upsertPreference = createRoute({
  method: "post",
  path: "/job-preferences/:jobId",
  request: {
    query: z.object({
      profileId: z.string(),
    }),
    params: z.object({
        jobId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: JobPreferenceUpsertSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Upsert job preference",
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(JobPreferenceSchema),
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
      description: "Internal Server Error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

const getPreference = createRoute({
  method: "get",
  path: "/job-preferences/:jobId",
  request: {
    query: z.object({
      profileId: z.string(),
    }),
    params: z.object({
        jobId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Get job preference",
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(
            z.object({
              jobId: z.string(),
              seen: z.boolean(),
              liked: z.boolean().nullable(),
            })
          ),
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
      description: "Internal Server Error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

const app = new OpenAPIHono();

app.openapi(upsertPreference, jobPreferenceController.upsertPreference);
app.openapi(getPreference, jobPreferenceController.getPreference);

export default app;