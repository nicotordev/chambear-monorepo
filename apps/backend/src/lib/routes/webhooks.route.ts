import stripe from "@/lib/stripe";
import response from "@/lib/utils/response";
import billingService from "@/services/billing.service";
import { Hono } from "hono";
import { prisma } from "../prisma";
import { PlanTier } from "../generated";

const app = new Hono();

app.post("/", async (c) => {
  const signature = c.req.header("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return c.json(response.badRequest("Missing signature or secret"), 400);
  }

  try {
    const body = await c.req.text();
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    console.log(`🔔 Stripe Webhook received: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        const tier = session.metadata?.tier as PlanTier;

        if (userId && tier) {
          await billingService.syncSubscription(
            userId,
            tier,
            session.subscription as string,
            "stripe"
          );

          // Update customer ID if not set
          await prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId: session.customer as string },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        // Logic to cancel or expire sub in DB
        const dbSub = await prisma.subscription.findUnique({
          where: { providerSubId: subscription.id },
        });

        if (dbSub) {
          await prisma.subscription.update({
            where: { id: dbSub.id },
            data: { status: "CANCELED" as any },
          });
        }
        break;
      }
    }

    return c.json({ received: true }, 200);
  } catch (err: any) {
    console.error(`❌ Webhook Error: ${err.message}`);
    return c.json(response.error(`Webhook Error: ${err.message}`), 400);
  }
});

export default app;
