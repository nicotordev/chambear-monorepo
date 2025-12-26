import { WorkMode, EmploymentType, Seniority, UrlKind } from "../lib/generated";
/* =========================
 * Mappings (Zod Strings -> Prisma Enums)
 * ========================= */

export const URL_KIND_MAP: Record<string, UrlKind> = {
  job_listing: UrlKind.JOB_LISTING,
  jobs_index: UrlKind.JOBS_INDEX,
  careers: UrlKind.CAREERS,
  login_or_gate: UrlKind.LOGIN_OR_GATE,
  blog_or_news: UrlKind.BLOG_OR_NEWS,
  company_about: UrlKind.COMPANY_ABOUT,
  irrelevant: UrlKind.IRRELEVANT,
};

export const WORK_MODE_MAP: Record<string, WorkMode> = {
  remote: WorkMode.REMOTE,
  hybrid: WorkMode.HYBRID,
  on_site: WorkMode.ONSITE,
  unknown: WorkMode.UNKNOWN,
};

export const EMPLOYMENT_TYPE_MAP: Record<string, EmploymentType> = {
  full_time: EmploymentType.FULL_TIME,
  part_time: EmploymentType.PART_TIME,
  contract: EmploymentType.CONTRACT,
  internship: EmploymentType.INTERN,
  temporary: EmploymentType.TEMPORARY,
  unknown: EmploymentType.UNKNOWN,
};

export const SENIORITY_MAP: Record<string, Seniority> = {
  junior: Seniority.JUNIOR,
  mid: Seniority.MID,
  senior: Seniority.SENIOR,
  staff: Seniority.STAFF,
  lead: Seniority.LEAD,
  principal: Seniority.PRINCIPAL,
  unknown: Seniority.UNKNOWN,
};
