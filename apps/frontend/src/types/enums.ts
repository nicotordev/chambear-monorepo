/**
 * @file src/types/enums.ts
 * Enums and constant definitions for the application.
 */

export const Role = {
  EMPLOYER: "EMPLOYER",
  EMPLOYEE: "EMPLOYEE",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const PlanTier = {
  FREE: "FREE",
  BASE: "BASE",
  PRO: "PRO",
  RESULT: "RESULT",
} as const;
export type PlanTier = (typeof PlanTier)[keyof typeof PlanTier];

export const SubscriptionStatus = {
  ACTIVE: "ACTIVE",
  TRIALING: "TRIALING",
  PAST_DUE: "PAST_DUE",
  CANCELED: "CANCELED",
  EXPIRED: "EXPIRED",
} as const;
export type SubscriptionStatus =
  (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const UrlKind = {
  JOB_LISTING: "JOB_LISTING",
  JOBS_INDEX: "JOBS_INDEX",
  CAREERS: "CAREERS",
  LOGIN_OR_GATE: "LOGIN_OR_GATE",
  BLOG_OR_NEWS: "BLOG_OR_NEWS",
  COMPANY_ABOUT: "COMPANY_ABOUT",
  IRRELEVANT: "IRRELEVANT",
} as const;
export type UrlKind = (typeof UrlKind)[keyof typeof UrlKind];

export const Seniority = {
  JUNIOR: "JUNIOR",
  MID: "MID",
  SENIOR: "SENIOR",
  STAFF: "STAFF",
  LEAD: "LEAD",
  PRINCIPAL: "PRINCIPAL",
  UNKNOWN: "UNKNOWN",
} as const;
export type Seniority = (typeof Seniority)[keyof typeof Seniority];

export const EmploymentType = {
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
  CONTRACT: "CONTRACT",
  TEMPORARY: "TEMPORARY",
  INTERN: "INTERN",
  FREELANCE: "FREELANCE",
  UNKNOWN: "UNKNOWN",
} as const;
export type EmploymentType =
  (typeof EmploymentType)[keyof typeof EmploymentType];

export const WorkMode = {
  ONSITE: "ONSITE",
  HYBRID: "HYBRID",
  REMOTE: "REMOTE",
  UNKNOWN: "UNKNOWN",
} as const;
export type WorkMode = (typeof WorkMode)[keyof typeof WorkMode];

export const ApplicationStatus = {
  SAVED: "SAVED",
  APPLIED: "APPLIED",
  INTERVIEW: "INTERVIEW",
  OFFER: "OFFER",
  INTERVIEWING: "INTERVIEWING",
  REJECTED: "REJECTED",
  HIRED: "HIRED",
  ARCHIVED: "ARCHIVED",
} as const;
export type ApplicationStatus =
  (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

export const DocumentType = {
  RESUME: "RESUME",
  COVER_LETTER: "COVER_LETTER",
  NOTE: "NOTE",
  OTHER: "OTHER",
} as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export const SkillLevel = {
  BEGINNER: "BEGINNER",
  INTERMEDIATE: "INTERMEDIATE",
  ADVANCED: "ADVANCED",
  EXPERT: "EXPERT",
} as const;
export type SkillLevel = (typeof SkillLevel)[keyof typeof SkillLevel];

export const JobSource = {
  MANUAL: "MANUAL",
  IMPORT: "IMPORT",
  EXTERNAL_API: "EXTERNAL_API",
  PARTNER: "PARTNER",
} as const;
export type JobSource = (typeof JobSource)[keyof typeof JobSource];

export const InterviewMode = {
  VIRTUAL: "VIRTUAL",
  ONSITE: "ONSITE",
  HYBRID: "HYBRID",
} as const;
export type InterviewMode = (typeof InterviewMode)[keyof typeof InterviewMode];

export const InterviewStatus = {
  PLANNING: "PLANNING",
  SCHEDULED: "SCHEDULED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type InterviewStatus =
  (typeof InterviewStatus)[keyof typeof InterviewStatus];

export const ReminderType = {
  FOLLOW_UP: "FOLLOW_UP",
  INTERVIEW_PREP: "INTERVIEW_PREP",
  DEADLINE: "DEADLINE",
} as const;
export type ReminderType = (typeof ReminderType)[keyof typeof ReminderType];
