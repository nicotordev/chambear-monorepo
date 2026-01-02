import aiActionController from "@/controllers/ai-action.controller";
import {
  CalculateFitSchema,
  GenerateCoverLetterSchema,
  OptimizeCvSchema,
} from "@/schemas/ai-action";
import { FitScoreSchema } from "@/schemas/application";
import { DocumentSchema } from "@/schemas/document";
import { RankedJobSchema } from "@/schemas/job";
import {
  createSuccessResponseSchema,
  ErrorResponseSchema,
} from "@/schemas/response";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

const app = new OpenAPIHono();

const optimizeCv = createRoute({
  method: "post",
  path: "/ai/optimize-cv",
  request: {
    query: z.object({
      profileId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: OptimizeCvSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Optimize CV",
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(DocumentSchema),
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
    402: {
      description: "Payment Required",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "Internal Server Error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

const generateCoverLetter = createRoute({
  method: "post",
  path: "/ai/generate-cover-letter",
  request: {
    query: z.object({
      profileId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: GenerateCoverLetterSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Generate Cover Letter",
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(DocumentSchema),
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
    402: {
      description: "Payment Required",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "Internal Server Error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

const calculateFit = createRoute({
  method: "post",
  path: "/ai/calculate-fit",
  request: {
    query: z.object({
      profileId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: CalculateFitSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Calculate Fit",
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(FitScoreSchema),
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
    402: {
      description: "Payment Required",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "Internal Server Error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

const scanJobs = createRoute({
  method: "get",
  path: "/ai/scan",
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
    402: {
      description: "Payment Required",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal Server Error",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

app.openapi(optimizeCv, aiActionController.optimizeCv);
app.openapi(generateCoverLetter, aiActionController.generateCoverLetter);
app.openapi(calculateFit, aiActionController.calculateFit);
app.openapi(scanJobs, aiActionController.scanJobs);

export default app;
