import stripe from "@/lib/stripe";
import response from "@/lib/utils/response";
import billingService from "@/services/billing.service";
import { processScrapeQueueDirect } from "@/workers/scrape.worker";
import { Hono } from "hono";
import { PlanTier } from "@/lib/generated";
import { prisma } from "@/lib/prisma";
import algoliaClient from "@/lib/algolia";

const app = new Hono();

const getBearer = (authHeader: string | null | undefined): string | null => {
  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
};

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
        let userId = session.metadata?.userId;
        const type = session.metadata?.type;

        console.log(`📦 Session metadata:`, session.metadata);

        // Fallback: if userId is missing in metadata, try to find user by stripeCustomerId or email
        if (!userId) {
          console.log(
            `🔍 userId missing in metadata, searching by customer/email...`
          );
          const stripeCustomerId = session.customer as string;
          const customerEmail =
            session.customer_details?.email || session.customer_email;

          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { stripeCustomerId: stripeCustomerId || undefined },
                { email: customerEmail || undefined },
              ],
            },
            select: { id: true },
          });

          if (user) {
            userId = user.id;
            console.log(`🎯 Found user by fallback: ${userId}`);
          }
        }

        if (type === "TOPUP") {
          const amount = Number.parseInt(session.metadata?.amount || "0", 10);
          console.log(
            `💰 TOPUP detected. userId: ${userId}, amount: ${amount}`
          );
          if (userId && amount > 0) {
            await billingService.addCredits(userId, amount, "STRIPE_TOPUP");
            console.log(`✅ Credits added successfully for user ${userId}`);
          } else {
            console.warn(
              `⚠️ Missing userId or invalid amount for topup. userId: ${userId}, amount: ${amount}`
            );
          }
        } else {
          const tier = session.metadata?.tier as PlanTier;
          console.log(
            `Subscription detected. userId: ${userId}, tier: ${tier}`
          );
          if (userId && tier) {
            await billingService.syncSubscription(
              userId,
              tier,
              session.subscription as string,
              "stripe"
            );
            console.log(
              `✅ Subscription synced successfully for user ${userId}`
            );
          } else {
            console.warn(
              `⚠️ Missing userId or tier for subscription. userId: ${userId}, tier: ${tier}`
            );
          }
        }

        // Update customer ID if not set
        if (userId && session.customer) {
          await prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId: session.customer as string },
          });
          console.log(`👤 Updated stripeCustomerId for user ${userId}`);
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
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return c.json(response.internalError("CRON_SECRET not configured"), 500);
  }

  const token = getBearer(c.req.header("authorization"));
  if (!token || token !== cronSecret) {
    return c.json(response.unauthorized(), 401);
  }

  const res = await processScrapeQueueDirect({
    concurrency: 5,
    maxJobs: 100,
    maxDurationMs: 4 * 60_000,
    idleWaitMs: 250,
  });

  return c.json(response.success(res), 200);
});

app.post("/algolia/sync", async (c) => {
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
