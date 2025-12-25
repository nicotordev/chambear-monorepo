import { JobSchema, type JobInput } from "@/schemas/job";
import { Job } from "../lib/generated";
import { prisma } from "../lib/prisma";

const jobsService = {
  /**
   * Create or Update a Job.
   * Logic:
   * 1. If externalUrl provided, try to find by that.
   * 2. If not, try to find by title + companyName.
   * 3. Update if found, Create if not.
   */
  async upsertJob(data: JobInput) {
    const validated = JobSchema.parse(data);
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

    return prisma.$transaction(async (tx) => {
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
        // To be safe and clean:
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

  async getPublicJobs() {
    return await prisma.job.findMany({
      select: {
        id: true,
        title: true,
        companyName: true,
        location: true,
        employmentType: true,
        workMode: true,
        description: true,
        source: true,
        externalUrl: true,
        postedAt: true,
        expiresAt: true,
        createdAt: true,
        jobSkills: {
          select: {
            skill: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },
};

export default jobsService;
