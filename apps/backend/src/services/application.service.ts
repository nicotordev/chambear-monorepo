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
  async upsertApplication(userId: string, jobId: string, data: ApplicationInput) {
    const validated = ApplicationUpsertSchema.parse(data);

    return prisma.application.upsert({
      where: {
        userId_jobId: {
          userId,
          jobId,
        },
      },
      create: {
        userId,
        jobId,
        ...validated,
      },
      update: {
        ...validated,
      },
      include: {
        job: {
            include: {
                jobSkills: { include: { skill: true } }
            }
        },
        resumeDocument: true,
        coverLetter: true,
      },
    });
  },

  /**
   * Get all applications for a user
   */
  async getUserApplications(userId: string) {
    return prisma.application.findMany({
      where: { userId },
      include: {
        job: {
          include: {
            jobSkills: { include: { skill: true } }, // Include skills to show match
            fitScores: {
                where: { userId } // Only include the fit score for this user
            }
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
  async saveFitScore(userId: string, jobId: string, data: FitScoreInput) {
    const { score, rationale } = FitScoreSchema.parse(data);

    return prisma.fitScore.upsert({
      where: {
        userId_jobId: {
          userId,
          jobId,
        },
      },
      create: {
        userId,
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
