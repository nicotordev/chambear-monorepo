import type { JobInput } from "@/schemas/job";
import {
  ApplicationStatus,
  EmploymentType,
  JobSource,
  WorkMode,
} from "../lib/generated";
import { prisma } from "../lib/prisma";
import { JobPosting, RankedJob } from "../scraping/clients/ai";
import applicationService from "./application.service";
import jobService from "./jobs.service";

const aiIntegrationService = {
  /**
   * Persist a list of JobPostings to the DB.
   * Returns a Map of sourceUrl -> jobId.
   */
  async persistJobsFromAi(
    jobs: readonly JobPosting[]
  ): Promise<Map<string, string>> {
    const sourceUrlToId = new Map<string, string>();

    // Process sequentially for now to be safe with upsert logic in jobService
    // (We could optimize to Promise.all but need to be careful with race conditions on "findFirst")
    for (const job of jobs) {
      try {
        const input: JobInput = {
          title: job.title,
          companyName: job.company ?? "Unknown Company",
          location: job.location,
          employmentType: mapEmploymentType(job.employmentType),
          workMode: mapWorkMode(job.remote),
          description: job.descriptionMarkdown,
          source: JobSource.EXTERNAL_API, // Or IMPORT
          externalUrl: job.applyUrl || null,
          skills: [...(job.requirements ?? []), ...(job.niceToHave ?? [])],
          rawData: {
            sourceUrl: job.sourceUrl,
            seniority: job.seniority,
            team: job.team,
            compensation: job.compensation,
            responsibilities: job.responsibilities,
          },
        };

        const savedJob = await jobService.upsertJob(input);
        sourceUrlToId.set(job.sourceUrl, savedJob.id);
      } catch (error) {
        console.error(`Failed to persist job ${job.title}:`, error);
        // Continue with others
      }
    }

    return sourceUrlToId;
  },

  /**
   * Persist FitScores and optionally create SAVED applications for top picks.
   */
  async persistRankings(
    userId: string,
    rankedJobs: readonly RankedJob[],
    sourceUrlToId: Map<string, string>,
    createApplicationsForTopK = 10
  ) {
    let count = 0;

    for (const item of rankedJobs) {
      const jobId = sourceUrlToId.get(item.job.sourceUrl);
      if (!jobId) {
        console.warn(
          `Skipping ranking persistence: No Job ID found for ${item.job.title}`
        );
        continue;
      }

      // 1. Save FitScore
      await applicationService.saveFitScore(userId, jobId, {
        score: Math.round(item.fitScore),
        rationale: {
          rationaleText: item.rationale,
          generatedAt: new Date().toISOString(),
          source: "ai_rerank",
        },
      });

      // 2. Optional: Create Application if Top K
      if (count < createApplicationsForTopK) {
        // Check if exists first to avoid overwriting status if already APPLIED
        const existingApp = await prisma.application.findUnique({
          where: { userId_jobId: { userId, jobId } },
        });

        if (!existingApp) {
          await applicationService.upsertApplication(userId, jobId, {
            status: ApplicationStatus.SAVED,
            notes: "Auto-saved by AI Recommendation",
          });
        }
      }
      count++;
    }
  },
};

export default aiIntegrationService;

// --- Helpers ---

function mapEmploymentType(type?: string): EmploymentType {
  switch (type) {
    case "full_time":
      return EmploymentType.FULL_TIME;
    case "part_time":
      return EmploymentType.PART_TIME;
    case "contract":
      return EmploymentType.CONTRACT;
    case "internship":
      return EmploymentType.INTERN;
    case "temporary":
      return EmploymentType.TEMPORARY;
    case "unknown":
      return EmploymentType.FULL_TIME; // Default
    default:
      return EmploymentType.FULL_TIME;
  }
}

function mapWorkMode(remote?: string): WorkMode {
  switch (remote) {
    case "remote":
      return WorkMode.REMOTE;
    case "hybrid":
      return WorkMode.HYBRID;
    case "on_site":
      return WorkMode.ONSITE;
    default:
      return WorkMode.HYBRID; // Default
  }
}
