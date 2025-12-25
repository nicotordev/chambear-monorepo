import { EmploymentType, JobSource, WorkMode } from "@/lib/generated";
import type { JobCreateInput } from "@/scraping/types";

export async function persistJobs(jobs: JobCreateInput[]): Promise<void> {
  if (jobs.length === 0) return;

  const jobService = (await import("@/services/jobs.service")).default;

  for (const job of jobs) {
    try {
      await jobService.upsertJob({
        ...job,
        employmentType:
          (job.employmentType as EmploymentType) || EmploymentType.FULL_TIME,
        workMode: (job.workMode as WorkMode) || WorkMode.HYBRID,
        source: (job.source as JobSource) || JobSource.EXTERNAL_API,
        skills: [], // scraped jobs via this path might not have parsed skills yet
        externalUrl: job.externalUrl || null, // ensure null if undefined
      });
    } catch (e) {
      console.error(`Failed to persist job ${job.title}`, e);
    }
  }
}
