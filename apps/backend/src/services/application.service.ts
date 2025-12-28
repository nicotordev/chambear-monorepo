import { prisma } from "../lib/prisma";
import {
  ApplicationUpsertSchema,
  FitScoreSchema,
  type ApplicationInput,
  type FitScoreInput,
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
};

export default applicationService;
