import billingController from "@/controllers/billing.controller";
import {
  createSuccessResponseSchema,
  ErrorResponseSchema,
} from "@/schemas/response";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

const PlanSchema = z
  .object({
    id: z.string(),
    tier: z.string(),
    name: z.string(),
    monthlyPriceUsd: z.number(),
    monthlyCredits: z.number(),
    description: z.string().nullable(),
    isActive: z.boolean(),
  })
  .openapi("Plan");

const SubscriptionSchema = z
  .object({
    subscription: z
      .object({
        id: z.string(),
        status: z.string(),
        currentPeriodEnd: z.string().or(z.date()),
        plan: PlanSchema,
      })
      .nullable(),
    balance: z.number(),
  })
  .openapi("SubscriptionInfo");

const CreditWalletSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    balance: z.number(),
    updatedAt: z.string().or(z.date()),
  })
  .openapi("CreditWallet");

const getPlans = createRoute({
  method: "get",
  path: "/plans",
  responses: {
    200: {
      description: "Get available plans",
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(z.array(PlanSchema)),
        },
      },
    },
  },
  tags: ["Billing"],
});

const getMySubscription = createRoute({
  method: "get",
  path: "/me",
  responses: {
    200: {
      description: "Get current user subscription and balance",
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(SubscriptionSchema),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
  tags: ["Billing"],
});

const topup = createRoute({
  method: "post",
  path: "/topup",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            amount: z.number(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Topup checkout session created",
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(z.object({ url: z.string() })),
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
  tags: ["Billing"],
});

const createCheckout = createRoute({
  method: "post",
  path: "/checkout",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            tier: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Checkout session created",
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(z.object({ url: z.string() })),
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
  },
  tags: ["Billing"],
});

const customerPortal = createRoute({
  method: "post",
  path: "/portal",
  responses: {
    200: {
      description: "Customer portal session created",
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(z.object({ url: z.string() })),
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
  },
  tags: ["Billing"],
});

const app = new OpenAPIHono();

app.openapi(getPlans, billingController.getPlans);
app.openapi(getMySubscription, billingController.getMySubscription);
app.openapi(topup, billingController.topup);
app.openapi(createCheckout, billingController.createCheckout);
app.openapi(customerPortal, billingController.customerPortal);

export default app;
