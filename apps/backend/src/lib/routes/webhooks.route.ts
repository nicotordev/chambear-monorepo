import stripe from "@/lib/stripe";
import response from "@/lib/utils/response";
import billingService from "@/services/billing.service";
import { processScrapeQueue } from "@/workers/scrape.worker";
import { Hono } from "hono";
import { PlanTier } from "../generated";
import { prisma } from "../prisma";
import algoliaClient from "../algolia";

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

// search the queue and run the scrapper
app.post("/scrappers/users", async (c) => {
  const authHeader = c.req.header("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Simple security check
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return c.json(response.unauthorized("Invalid Cron Secret"), 401);
  }

  try {
    console.log("Starting scheduled scrape processing...");
    // This will run until queue is empty or timeout
    await processScrapeQueue();
    return c.json(response.success({ message: "Scrape batch processed" }), 200);
  } catch (error: any) {
    console.error("Scrape processing error:", error);
    return c.json(response.error(error.message), 500);
  }
});

app.post("/sync/algolia", async (c) => {
  const authHeader = c.req.header("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Simple security check
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return c.json(response.unauthorized("Invalid Cron Secret"), 401);
  }

  try {
    let created = 0;
    const jobs = await prisma.job.findMany({
      where: {
        algoliaId: null,
      },
    });
    const thousandsBatches = [];

    for (let i = 0; i < jobs.length; i += 1000) {
      thousandsBatches.push(jobs.slice(i, i + 1000));
    }

    for (const batch of thousandsBatches) {
      const jobsBatch = await algoliaClient.saveObjects({
        indexName: "jobs",
        objects: batch,
      });
      created += jobsBatch.length;
    }
    return c.json(
      response.success({ message: "Jobs synced to Algolia", created }),
      200
    );
  } catch (error: any) {
    console.error("Scrape processing error:", error);
    return c.json(response.error(error.message), 500);
  }
});

export default app;
