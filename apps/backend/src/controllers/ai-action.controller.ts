import redisClient from "@/lib/redis";
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

  requestScanJobs: async (c: Context) => {
    const auth = getAuth(c);
    const userId = auth?.userId;
    const profileId = c.req.query("profileId");

    if (!userId || !profileId) {
      return c.json(response.unauthorized(), 401);
    }

    const key = `scan:${userId}:${profileId}`;
    const findCurrentScan = await redisClient.get(key);

    if (findCurrentScan) {
      return c.json(response.error("Scan already in progress"), 400);
    }

    try {
      await redisClient.set(key, "pending");
      return c.json(response.success(null), 200);
    } catch (error: any) {
      console.error(error);
      return c.json(
        response.error(error.message || "Failed to scan jobs"),
        500
      );
    }
  },
  async getRequestedScanStatus(c: Context) {
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

    const state = await redisClient.get(jobId);

    return c.json(response.success({ status: state, jobId }), 200);
  },
  async parseResume(c: Context) {
    const auth = getAuth(c);
    const userId = auth?.userId;
    const profileId = c.req.query("profileId");

    if (!userId || !profileId) {
      return c.json(response.unauthorized(), 401);
    }

    try {
      const body = await c.req.json();
      const { documentId, content } = body;

      // Check credits
      const canAction = await billingService.canUserAction(
        userId,
        "CV_EXTRACTION"
      );
      if (!canAction) {
        return c.json(
          response.error({ message: "Insufficient credits", status: 402 }),
          402
        );
      }

      const parsedProfile = await aiActionService.parseResume(
        profileId,
        documentId,
        content
      );

      // Consume credits
      await billingService.consumeCredits(userId, "CV_EXTRACTION");

      return c.json(response.success(parsedProfile), 200);
    } catch (error: any) {
      console.error(error);
      return c.json(
        response.error(error.message || "Failed to parse resume"),
        500
      );
    }
  },
};

export default aiActionController;
