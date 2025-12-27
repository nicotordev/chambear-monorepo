import userController from "@/controllers/user.controller";
import {
  createSuccessResponseSchema,
  ErrorResponseSchema,
} from "@/schemas/response";
import { CreateProfileSchema } from "@/schemas/user";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

const upsertProfile = createRoute({
  method: "post",
  path: "/user/profile",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateProfileSchema,
        },
      },
      description: "Profile data to upsert",
      required: true,
    },
  },
  responses: {
    200: {
      description: "User profile upserted successfully",
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(z.any()),
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

const getMe = createRoute({
  method: "get",
  path: "/user/me",
  responses: {
    200: {
      description: "Get current user profile",
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(z.any()),
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
    404: {
      description: "User profile not found",
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

const app = new OpenAPIHono();

app.openapi(upsertProfile, userController.upsertProfile);
app.openapi(getMe, userController.getMe);

export default app;
