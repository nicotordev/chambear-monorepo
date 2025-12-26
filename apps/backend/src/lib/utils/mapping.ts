import type {
  JobPosting,
  NormalizedJobPosting,
  PineconeJobMetadata,
} from "@/types/ai";
import { EmploymentType, WorkMode, JobSource, Seniority } from "../generated";

export const mapEmploymentType = (
  type: string | undefined | null
): EmploymentType => {
  if (!type) return EmploymentType.FULL_TIME;
  const normalized = type.toUpperCase().replace("-", "_").replace(" ", "_");
  if (normalized in EmploymentType) {
    return EmploymentType[normalized as keyof typeof EmploymentType];
  }
  // Fallback
  if (normalized.includes("PART")) return EmploymentType.PART_TIME;
  if (normalized.includes("CONTRACT")) return EmploymentType.CONTRACT;
  if (normalized.includes("INTERN")) return EmploymentType.INTERN;
  if (normalized.includes("TEMP")) return EmploymentType.TEMPORARY;
  if (normalized.includes("FREE")) return EmploymentType.FREELANCE;
  return EmploymentType.FULL_TIME;
};

export const mapWorkMode = (mode: string | undefined | null): WorkMode => {
  if (!mode) return WorkMode.ONSITE;
  const normalized = mode.toUpperCase().replace("-", "_").replace(" ", "_");
  if (normalized in WorkMode) {
    return WorkMode[normalized as keyof typeof WorkMode];
  }
  if (normalized.includes("REMOTE")) return WorkMode.REMOTE;
  if (normalized.includes("HYBRID")) return WorkMode.HYBRID;
  return WorkMode.ONSITE;
};

export const mapJobSource = (source: string | undefined | null): JobSource => {
  // Default to EXTERNAL_API for scraped jobs unless specified
  return JobSource.EXTERNAL_API;
};

export const mapSeniority = (
  seniority: string | undefined | null
): Seniority => {
  if (!seniority) return Seniority.UNKNOWN;
  const normalized = seniority
    .toUpperCase()
    .replace("-", "_")
    .replace(" ", "_");
  if (normalized in Seniority) {
    return Seniority[normalized as keyof typeof Seniority];
  }
  // Fallback
  if (normalized.includes("JUNIOR")) return Seniority.JUNIOR;
  if (normalized.includes("MID")) return Seniority.MID;
  if (normalized.includes("SENIOR")) return Seniority.SENIOR;
  if (normalized.includes("STAFF")) return Seniority.STAFF;
  if (normalized.includes("LEAD")) return Seniority.LEAD;
  if (normalized.includes("PRINCIPAL")) return Seniority.PRINCIPAL;
  return Seniority.UNKNOWN;
};

export const normalizeJobPosting = (job: JobPosting): NormalizedJobPosting => {
  const remote: WorkMode = mapWorkMode(job.remote);
  const employmentType: EmploymentType = mapEmploymentType(job.employmentType);
  const seniority: Seniority = mapSeniority(job.seniority);

  return {
    ...job,
    remote,
    employmentType,
    seniority,
  };
};

export const toPineconeMetadata = (job: JobPosting): PineconeJobMetadata => {
  const n = normalizeJobPosting(job);

  return {
    title: n.title,
    company: n.company,
    location: n.location,
    remote: n.remote,
    employmentType: n.employmentType,
    seniority: n.seniority,
    sourceUrl: n.sourceUrl,
    applyUrl: n.applyUrl,
  };
};
