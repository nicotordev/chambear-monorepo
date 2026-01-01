import response from "@/lib/utils/response";
import billingService from "@/services/billing.service";
import { getAuth } from "@hono/clerk-auth";
import type { Context } from "hono";

const billingController = {
  async getPlans(c: Context) {
    const plans = await billingService.getPlans();
    return c.json(response.success(plans), 200);
  },

  async getMySubscription(c: Context) {
    const auth = getAuth(c);
    const userId = auth?.userId;

    if (!userId) {
      return c.json(response.unauthorized(), 401);
    }

    const sub = await billingService.getUserSubscription(userId);
    const balance = await billingService.getUserBalance(userId);

    return c.json(response.success({ subscription: sub, balance }), 200);
  },

  async topup(c: Context) {
    const auth = getAuth(c);
    const userId = auth?.userId;

    if (!userId) {
      return c.json(response.unauthorized(), 401);
    }

    try {
      const { amount } = await c.req.json();
      if (!amount || amount <= 0) {
        return c.json(response.badRequest("Invalid amount"), 400);
      }

      // In a real app, this would be handled by Stripe webhooks
      // For now, we'll simulate adding credits
      const wallet = await billingService.addCredits(userId, amount);
      return c.json(response.success(wallet), 200);
    } catch (error) {
      return c.json(response.error("Failed to add credits"), 500);
    }
  },

  async createCheckout(c: Context) {
    const auth = getAuth(c);
    const userId = auth?.userId;

    if (!userId) {
      return c.json(response.unauthorized(), 401);
    }

    try {
      const { tier } = await c.req.json();
      const url = await billingService.createCheckoutSession(userId, tier);
      return c.json(response.success({ url }), 200);
    } catch (error: any) {
      return c.json(response.error(error.message), 400);
    }
  },

  async customerPortal(c: Context) {
    const auth = getAuth(c);
    const userId = auth?.userId;

    if (!userId) {
      return c.json(response.unauthorized(), 401);
    }

    try {
      const url = await billingService.createPortalSession(userId);
      return c.json(response.success({ url }), 200);
    } catch (error: any) {
      return c.json(response.error(error.message), 400);
    }
  },
};

export default billingController;
