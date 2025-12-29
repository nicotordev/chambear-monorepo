import response from "@/lib/utils/response";
import {
  ApplicationUpsertSchema,
  CreateInterviewSchema,
} from "@/schemas/application";
import applicationService from "@/services/application.service";
import { getAuth } from "@hono/clerk-auth";
import type { Context, Env } from "hono";

const applicationsController = {
  getApplications: async (
    c: Context<Env, "/applications", { in: { query: { profileId: string } } }>
  ) => {
    const auth = getAuth(c);
    const userId = auth?.userId;
    const profileId = c.req.query("profileId");

    if (!userId || !profileId) {
      if (!profileId) {
        return c.json(response.badRequest("Profile ID is required"), 400);
      }
      return c.json(response.unauthorized(), 401);
    }

    try {
      const applications = await applicationService.getUserApplications(
        profileId
      );
      return c.json(response.success(applications), 200);
    } catch (error) {
      console.error(error);
      return c.json(response.error("Failed to retrieve applications"), 500);
    }
  },

  getApplicationById: async (c: Context) => {
    const auth = getAuth(c);
    const userId = auth?.userId;
    const profileId = c.req.query("profileId");
    const id = c.req.param("id");

    if (!userId || !profileId) {
      return c.json(response.unauthorized(), 401);
    }

    try {
      const application = await applicationService.getApplicationById(
        profileId,
        id
      );
      return c.json(response.success(application), 200);
    } catch (error) {
      return c.json(response.notFound("Application not found"), 404);
    }
  },

  upsertApplication: async (c: Context) => {
    const auth = getAuth(c);
    const userId = auth?.userId;
    const profileId = c.req.query("profileId");

    if (!userId || !profileId) {
      return c.json(response.unauthorized(), 401);
    }

    try {
      const body = await c.req.json();
      const jobId = body.jobId;

      if (!jobId) {
        return c.json(response.badRequest("Job ID is required"), 400);
      }

      // Validate body excluding jobId (upsert schema doesn't have it)
      const validatedBody = ApplicationUpsertSchema.parse(body);

      const application = await applicationService.upsertApplication(
        profileId,
        jobId,
        validatedBody
      );

      return c.json(response.success(application), 200);
    } catch (error) {
      console.error(error);
      return c.json(response.error("Failed to upsert application"), 500);
    }
  },

  deleteApplication: async (c: Context) => {
    const auth = getAuth(c);
    const userId = auth?.userId;
    const profileId = c.req.query("profileId");
    const id = c.req.param("id");

    if (!userId || !profileId) {
      return c.json(response.unauthorized(), 401);
    }

    try {
      await applicationService.deleteApplication(profileId, id);
      return c.json(response.success({ success: true }), 200);
    } catch (error) {
      return c.json(response.notFound("Application not found"), 404);
    }
  },

  createInterview: async (c: Context) => {
    const auth = getAuth(c);
    const userId = auth?.userId;
    const profileId = c.req.query("profileId");
    const id = c.req.param("id"); // Application ID

    if (!userId || !profileId) {
      return c.json(response.unauthorized(), 401);
    }

    try {
      const body = await c.req.json();
      const validatedBody = CreateInterviewSchema.parse(body);

      const interview = await applicationService.createInterviewSession(
        profileId,
        id,
        validatedBody
      );

      return c.json(response.success(interview), 200);
    } catch (error) {
      console.error(error);
      return c.json(response.error("Failed to create interview session"), 400); // 400 likely validation or not found
    }
  },
};

export default applicationsController;
