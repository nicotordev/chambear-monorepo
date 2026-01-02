import { CREDIT_COSTS, CreditAction } from "../config/billing.config";
import {
  CreditActionType,
  PlanTier,
  SubscriptionStatus,
} from "../lib/generated";
import { prisma } from "../lib/prisma";
import stripe from "../lib/stripe";

export const billingService = {
  async resolveUserId(id: string) {
    if (id.startsWith("user_")) {
      const user = await prisma.user.findUnique({
        where: { clerkId: id },
        select: { id: true },
      });
      if (!user) throw new Error(`User not found for Clerk ID: ${id}`);
      return user.id;
    }
    return id;
  },

  async getUserBalance(userId: string) {
    const internalId = await this.resolveUserId(userId);
    const wallet = await prisma.creditWallet.findUnique({
      where: { userId: internalId },
    });
    return wallet?.balance ?? 0;
  },

  async getUserSubscription(userId: string) {
    const internalId = await this.resolveUserId(userId);
    return prisma.subscription.findUnique({
      where: { userId: internalId },
      include: { plan: true },
    });
  },

  async getPlans() {
    return prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPriceUsd: "asc" },
    });
  },

  /**
   * Check if a user can perform an action based on their subscription tier and credit balance.
   */
  async canUserAction(userId: string, action: CreditAction) {
    // Check tier-specific limits (e.g., daily limits)
    // For now, we'll mostly rely on credits.

    const balance = await this.getUserBalance(userId);
    const cost = CREDIT_COSTS[action];

    return balance >= cost;
  },

  /**
   * Consume credits for a specific action.
   */
  async consumeCredits(userId: string, action: CreditAction) {
    const internalId = await this.resolveUserId(userId);
    const amount = CREDIT_COSTS[action];

    return prisma.$transaction(async (tx) => {
      // Ensure wallet exists
      let wallet = await tx.creditWallet.findUnique({
        where: { userId: internalId },
      });

      if (!wallet) {
        wallet = await tx.creditWallet.create({
          data: { userId: internalId, balance: 0 },
        });
      }

      if (wallet.balance < amount) {
        throw new Error("Insufficient credits");
      }

      const updatedWallet = await tx.creditWallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: amount },
        },
      });

      await tx.creditMovement.create({
        data: {
          walletId: wallet.id,
          amount: -amount,
          action: action as CreditActionType,
          meta: { action },
        },
      });

      return updatedWallet;
    });
  },

  /**
   * Simulated top-up or credit grant.
   */
  async addCredits(
    userId: string,
    amount: number,
    actionName: string = "TOPUP"
  ) {
    const internalId = await this.resolveUserId(userId);
    return prisma.$transaction(async (tx) => {
      let wallet = await tx.creditWallet.findUnique({
        where: { userId: internalId },
      });

      if (!wallet) {
        wallet = await tx.creditWallet.create({
          data: { userId: internalId, balance: 0 },
        });
      }

      const updatedWallet = await tx.creditWallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: amount },
        },
      });

      await tx.creditMovement.create({
        data: {
          walletId: wallet.id,
          amount: amount,
          action: CreditActionType.OTHER,
          meta: { action: actionName },
        },
      });

      return updatedWallet;
    });
  },

  /**
   * Logic to sync subscription (e.g., after Stripe webhook)
   */
  async syncSubscription(
    userId: string,
    tier: PlanTier,
    providerSubId: string,
    provider: string
  ) {
    const internalId = await this.resolveUserId(userId);
    const plan = await prisma.plan.findUniqueOrThrow({ where: { tier } });

    return prisma.$transaction(async (tx) => {
      const existingSub = await tx.subscription.findUnique({
        where: { userId: internalId },
      });

      const now = new Date();
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const sub = await tx.subscription.upsert({
        where: { userId: internalId },
        create: {
          userId: internalId,
          planId: plan.id,
          status: SubscriptionStatus.ACTIVE,
          provider,
          providerSubId,
          currentPeriodStart: now,
          currentPeriodEnd: nextMonth,
        },
        update: {
          planId: plan.id,
          status: SubscriptionStatus.ACTIVE,
          providerSubId, // Update sub ID if changed
          currentPeriodEnd: nextMonth,
        },
      });

      // Grant monthly credits only if it's a new subscription or a different plan
      // OR if the previous period has definitely ended.
      // This is a simple heuristic; Stripe billing period would be better.
      const shouldGrantCredits =
        !existingSub ||
        existingSub.planId !== plan.id ||
        existingSub.currentPeriodEnd < now;

      if (shouldGrantCredits) {
        await this.addCredits(internalId, plan.monthlyCredits, "MONTHLY_GRANT");
      }

      return sub;
    });
  },

  async createCheckoutSession(userId: string, tier: PlanTier): Promise<string> {
    const internalId = await this.resolveUserId(userId);
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: internalId },
    });

    const plan = await prisma.plan.findUniqueOrThrow({
      where: { tier },
    });

    if (!plan.stripePriceId) {
      throw new Error(
        `Plan ${tier} does not have a Stripe Price ID configured`
      );
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: user.stripeCustomerId || undefined,
      customer_email: user.stripeCustomerId ? undefined : user.email,
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${frontendUrl}/dashboard/billing?success=true`,
      cancel_url: `${frontendUrl}/dashboard/billing?canceled=true`,
      metadata: {
        userId: internalId, // Store internal ID
        tier,
      },
    });

    if (!session.url) {
      throw new Error("Failed to create Stripe checkout session");
    }

    return session.url;
  },

  async createTopupSession(userId: string, amount: number): Promise<string> {
    const internalId = await this.resolveUserId(userId);
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: internalId },
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    // Simplified: $1 for 2 credits (0.50 per credit)
    const priceInCents = Math.round(amount * 50);

    const session = await stripe.checkout.sessions.create({
      customer: user.stripeCustomerId || undefined,
      customer_email: user.stripeCustomerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${amount} Additional Credits`,
              description: `One-time purchase of ${amount} credits for AI actions.`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${frontendUrl}/dashboard/billing?success=true`,
      cancel_url: `${frontendUrl}/dashboard/billing?canceled=true`,
      metadata: {
        userId: internalId,
        type: "TOPUP",
        amount: amount.toString(),
      },
    });

    if (!session.url) {
      throw new Error("Failed to create Stripe top-up session");
    }

    return session.url;
  },

  async createPortalSession(userId: string): Promise<string> {
    const internalId = await this.resolveUserId(userId);
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: internalId },
    });

    if (!user.stripeCustomerId) {
      throw new Error("User does not have a Stripe Customer ID");
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${frontendUrl}/dashboard/billing`,
    });

    if (!session.url) {
      throw new Error("Failed to create Stripe portal session");
    }

    return session.url;
  },
};

export default billingService;
