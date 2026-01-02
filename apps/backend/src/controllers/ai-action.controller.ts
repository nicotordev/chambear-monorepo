import { scrapeQueue } from "@/lib/queue";
import response from "@/lib/utils/response";
import {
  CalculateFitSchema,
  GenerateCoverLetterSchema,
  OptimizeCvSchema,
} from "@/schemas/ai-action";
import aiActionService from "@/services/ai-action.service";
import billingService from "@/services/billing.service";
import { getAuth } from "@hono/clerk-auth";
import type { Context } from "hono";

const aiActionController = {
  async optimizeCv(c: Context) {
    const auth = getAuth(c);
    const userId = auth?.userId;
    const profileId = c.req.query("profileId");

    if (!userId || !profileId) {
      return c.json(response.unauthorized(), 401);
    }

    try {
      const body = await c.req.json();
      const { jobId } = OptimizeCvSchema.parse(body);

      // Check credits
      const canAction = await billingService.canUserAction(
        userId,
        "CV_OPTIMIZATION"
      );
      if (!canAction) {
        return c.json(
          response.error({ message: "Insufficient credits", status: 402 }),
          402
        );
      }

      const doc = await aiActionService.optimizeCv(userId, profileId, jobId);

      // Consume credits
      await billingService.consumeCredits(userId, "CV_OPTIMIZATION");

      return c.json(response.success(doc), 200);
    } catch (error: any) {
      console.error(error);
      return c.json(
        response.error(error.message || "Failed to optimize CV"),
        500
      );
    }
  },

  async generateCoverLetter(c: Context) {
    const auth = getAuth(c);
    const userId = auth?.userId;
    const profileId = c.req.query("profileId");

    if (!userId || !profileId) {
      return c.json(response.unauthorized(), 401);
    }

    try {
      const body = await c.req.json();
      const { jobId } = GenerateCoverLetterSchema.parse(body);

      // Check credits
      const canAction = await billingService.canUserAction(
        userId,
        "COVER_LETTER"
      );
      if (!canAction) {
        return c.json(
          response.error({ message: "Insufficient credits", status: 402 }),
          402
        );
      }

      const doc = await aiActionService.generateCoverLetter(
        userId,
        profileId,
        jobId
      );

      // Consume credits
      await billingService.consumeCredits(userId, "COVER_LETTER");

      return c.json(response.success(doc), 200);
    } catch (error: any) {
      console.error(error);
      return c.json(
        response.error(error.message || "Failed to generate Cover Letter"),
        500
      );
    }
  },

  async calculateFit(c: Context) {
    const auth = getAuth(c);
    const userId = auth?.userId;
    const profileId = c.req.query("profileId");

    if (!userId || !profileId) {
      return c.json(response.unauthorized(), 401);
    }

    try {
      const body = await c.req.json();
      const { jobId } = CalculateFitSchema.parse(body);

      // Check credits
      const canAction = await billingService.canUserAction(
        userId,
        "SKILL_GAP_ANALYSIS"
      );
      if (!canAction) {
        return c.json(
          response.error({ message: "Insufficient credits", status: 402 }),
          402
        );
      }

      const fitScore = await aiActionService.calculateFit(profileId, jobId);

      // Consume credits
      await billingService.consumeCredits(userId, "SKILL_GAP_ANALYSIS");

      return c.json(response.success(fitScore), 200);
    } catch (error: any) {
      console.error(error);
      return c.json(
        response.error(error.message || "Failed to calculate fit"),
        500
      );
    }
  },

  scanJobs: async (c: Context) => {
    const auth = getAuth(c);
    const userId = auth?.userId;
    const profileId = c.req.query("profileId");

    if (!userId || !profileId) {
      return c.json(response.unauthorized(), 401);
    }

    try {
      const scannedJobs = await aiActionService.scanJobs(profileId);
      return c.json(response.success([...scannedJobs]), 200);
    } catch (error: any) {
      console.error(error);
      return c.json(
        response.error(error.message || "Failed to scan jobs"),
        500
      );
    }
  },
  async getScanStatus(c: Context) {
    const auth = getAuth(c);
    const userId = auth?.userId;

    if (!userId) {
      return c.json(response.unauthorized(), 401);
    }

    const profileId = c.req.query("profileId");
    if (!profileId) {
      return c.json(response.badRequest("Profile ID is required"), 400);
    }

    const jobId = `scan:${userId}:${profileId}`;
    const job = await scrapeQueue.getJob(jobId);

    if (!job) {
      return c.json(response.success({ status: "idle" }), 200);
    }

    const state = await job.getState();
    return c.json(response.success({ status: state, jobId }), 200);
  },
};

export default aiActionController;
