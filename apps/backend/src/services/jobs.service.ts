import { JobUpsertSchema, type JobUpsertInput } from "@/schemas/job";
import { pineconeJobsClient } from "@/scraping/clients";
import { JobPosting } from "@/types/ai";
import { Job } from "../lib/generated";
import { prisma } from "../lib/prisma";
import { generateEmbedding } from "../lib/utils/ai";
import recommendationService from "./recommendation.service";

const jobsService = {
  /**
   * Create or Update a Job.
   * Logic:
   * 1. If externalUrl provided, try to find by that.
   * 2. If not, try to find by title + companyName.
   * 3. Update if found, Create if not.
   * 4. Index to Pinecone.
   */
  async upsertJob(data: JobUpsertInput) {
    const validated = JobUpsertSchema.parse(data);
    const { jobSkills, ...jobData } = validated;

    // We need to find the job manually because there is no unique constraint on externalUrl or title+company
    let existingJob: Job | null = null;

    if (jobData.externalUrl) {
      existingJob = await prisma.job.findFirst({
        where: { externalUrl: jobData.externalUrl },
      });
    }

    if (!existingJob) {
      existingJob = await prisma.job.findFirst({
        where: {
          title: jobData.title,
          companyName: jobData.companyName,
        },
      });
    }

    const savedJob = await prisma.$transaction(async (tx) => {
      // Handle Company Linkage
      if (jobData.companyName) {
        const company = await tx.company.upsert({
          where: { name: jobData.companyName },
          create: { name: jobData.companyName },
          update: {},
        });
        jobData.companyId = company.id;
      }

      let job: Job;

      if (existingJob) {
        job = await tx.job.update({
          where: { id: existingJob.id },
          data: jobData,
        });
      } else {
        job = await tx.job.create({
          data: jobData,
        });
      }

      // Handle Job Skills
      if (jobSkills && jobSkills.length > 0) {
        // Find/Create skills first
        const skillIds: string[] = [];
        for (const { skill } of jobSkills) {
          const s = await tx.skill.upsert({
            where: { name: skill.name },
            create: { name: skill.name },
            update: {},
          });
          skillIds.push(s.id);
        }

        // Sync JobSkills (delete and recreate for simplicity, or just ignore duplicates)
        await tx.jobSkill.deleteMany({ where: { jobId: job.id } });
        await tx.jobSkill.createMany({
          data: skillIds.map((sid) => ({
            jobId: job.id,
            skillId: sid,
          })),
        });
      }

      return tx.job.findUniqueOrThrow({
        where: { id: job.id },
        include: {
          jobSkills: { include: { skill: true } },
        },
      });
    });

    // Index to Pinecone (Fire & Forget or Await?)
    // Await to ensure consistency for this call
    try {
      const jobPosting: JobPosting = {
        title: savedJob.title,
        company: savedJob.companyName,
        location: savedJob.location || undefined,
        remote: savedJob.workMode,
        employmentType: savedJob.employmentType,
        sourceUrl: savedJob.externalUrl || `local:${savedJob.id}`,
        descriptionMarkdown: savedJob.description || "",
        // Add other fields if you have them in the DB
      };

      await pineconeJobsClient.indexJobsToPinecone({
        jobs: [jobPosting],
        embed: generateEmbedding,
      });
    } catch (error) {
      console.error("Failed to index job to Pinecone", error);
      // Don't fail the request? Or do?
      // Usually we don't want to block user action if search index fails, but for a backend job it might be important.
    }

    return savedJob;
  },

  async getJob(id: string) {
    return prisma.job.findUnique({
      where: { id },
      include: {
        jobSkills: { include: { skill: true } },
        fitScores: true,
      },
    });
  },

  async scanJobs(profileId: string) {
    return recommendationService.scanJobs(profileId);
  },

  async getPublicJobs() {
    return await prisma.job.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        company: true,
        jobSkills: {
          include: {
            skill: true,
          },
        },
      },
    });
  },

  async applyJob(jobId: string, userId: string) {
    const application = await prisma.application.create({
      data: {
        jobId,
        profileId: userId,
      },
    });
    return application;
  },
};

export default jobsService;
