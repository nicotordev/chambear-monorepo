import { prisma } from "../lib/prisma";
import {
  JobPreferenceUpsertSchema,
  type JobPreferenceUpsertInput,
} from "@/schemas/job-preference";

const jobPreferenceService = {
  async upsertPreference(
    profileId: string,
    jobId: string,
    data: JobPreferenceUpsertInput
  ) {
    const { liked } = JobPreferenceUpsertSchema.parse(data);

    return prisma.jobPreference.upsert({
      where: {
        profileId_jobId: {
          profileId,
          jobId,
        },
      },
      create: {
        profileId,
        jobId,
        liked,
      },
      update: {
        liked,
      },
    });
  },

  async getPreference(profileId: string, jobId: string) {
    return prisma.jobPreference.findUnique({
      where: {
        profileId_jobId: {
          profileId,
          jobId,
        },
      },
    });
  },
};

export default jobPreferenceService;