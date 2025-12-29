import { prisma } from "../lib/prisma";
import {
  ApplicationUpsertSchema,
  FitScoreSchema,
  CreateInterviewSchema,
  type ApplicationInput,
  type FitScoreInput,
  type CreateInterviewInput,
} from "@/schemas/application";

const applicationService = {
  /**
   * Upsert an application for a User + Job.
   * Uses @@unique([userId, jobId])
   */
  async upsertApplication(
    profileId: string,
    jobId: string,
    data: ApplicationInput
  ) {
    const validated = ApplicationUpsertSchema.parse(data);

    return prisma.application.upsert({
      where: {
        profileId_jobId: {
          profileId,
          jobId,
        },
      },
      create: {
        profileId,
        jobId,
        ...validated,
      },
      update: {
        ...validated,
      },
      include: {
        job: {
          include: {
            jobSkills: { include: { skill: true } },
          },
        },
        resumeDocument: true,
        coverLetter: true,
      },
    });
  },

  /**
   * Get all applications for a user
   */
  async getUserApplications(profileId: string) {
    return prisma.application.findMany({
      where: { profileId },
      include: {
        job: {
          include: {
            jobSkills: { include: { skill: true } }, // Include skills to show match
            fitScores: {
              where: { profileId }, // Only include the fit score for this user
            },
          },
        },
        resumeDocument: true,
        coverLetter: true,
      },
      orderBy: { updatedAt: "desc" },
    });
  },

  /**
   * Save (Upsert) FitScore for a User + Job
   */
  async saveFitScore(profileId: string, jobId: string, data: FitScoreInput) {
    const { score, rationale } = FitScoreSchema.parse(data);

    return prisma.fitScore.upsert({
      where: {
        profileId_jobId: {
          profileId,
          jobId,
        },
      },
      create: {
        profileId,
        jobId,
        score,
        rationale,
      },
      update: {
        score,
        rationale,
      },
    });
  },

  /**
   * Get application by ID
   */
  async getApplicationById(profileId: string, applicationId: string) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: {
            jobSkills: { include: { skill: true } },
            fitScores: { where: { profileId } },
          },
        },
        resumeDocument: true,
        coverLetter: true,
      },
    });

    if (!application || application.profileId !== profileId) {
      throw new Error("Application not found or access denied");
    }

    return application;
  },

  /**
   * Delete application
   */
  async deleteApplication(profileId: string, applicationId: string) {
    // Verify ownership first
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application || application.profileId !== profileId) {
      throw new Error("Application not found or access denied");
    }

    return prisma.application.delete({
      where: { id: applicationId },
    });
  },

  /**
   * Create an interview session associated with an application (via Job)
   */
  async createInterviewSession(
    profileId: string,
    applicationId: string,
    data: CreateInterviewInput
  ) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application || application.profileId !== profileId) {
      throw new Error("Application not found or access denied");
    }

    const validated = CreateInterviewSchema.parse(data);

    return prisma.interviewSession.create({
      data: {
        profileId,
        jobId: application.jobId,
        ...validated,
      },
    });
  },
};

export default applicationService;
