import response from "@/lib/utils/response";
import {
  JobPreferenceUpsertSchema,
  JobPreferenceStatusSchema,
} from "@/schemas/job-preference";
import jobPreferenceService from "@/services/job-preference.service";
import { getAuth } from "@hono/clerk-auth";
import type { Context } from "hono";

const jobPreferenceController = {
  async upsertPreference(c: Context) {
    const auth = getAuth(c);
    const userId = auth?.userId;
    const profileId = c.req.query("profileId");
    const jobId = c.req.param("jobId");

    if (!userId) {
        return c.json(response.unauthorized(), 401);
    }
    
    if (!profileId || !jobId) {
        return c.json(
          response.badRequest("Profile ID and job ID are required"),
          400
        );
    }

    try {
      const body = await c.req.json();
      const validated = JobPreferenceUpsertSchema.parse(body);
      const preference = await jobPreferenceService.upsertPreference(
        profileId,
        jobId,
        validated
      );

      return c.json(response.success(preference), 200);
    } catch (error: any) {
      console.error(error);
      return c.json(
        response.error(error.message || "Failed to upsert preference"),
        500
      );
    }
  },

  async getPreference(c: Context) {
    const auth = getAuth(c);
    const userId = auth?.userId;
    const profileId = c.req.query("profileId");
    const jobId = c.req.param("jobId");

    if (!userId) {
        return c.json(response.unauthorized(), 401);
    }

    if (!profileId || !jobId) {
        return c.json(
          response.badRequest("Profile ID and job ID are required"),
          400
        );
    }

    try {
      const preference = await jobPreferenceService.getPreference(
        profileId,
        jobId
      );

      const payload = JobPreferenceStatusSchema.parse({
        jobId,
        seen: Boolean(preference),
        liked: preference?.liked ?? null,
      });

      return c.json(response.success(payload), 200);
    } catch (error: any) {
      console.error(error);
      return c.json(
        response.error(error.message || "Failed to retrieve preference"),
        500
      );
    }
  },
};

export default jobPreferenceController;