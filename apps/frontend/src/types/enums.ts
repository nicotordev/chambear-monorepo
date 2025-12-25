/**
 * @file src/types/enums.ts
 * Enums and constant definitions for the application.
 */

export const Role = {
  BUYER: "BUYER",
  SELLER: "SELLER",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const EmploymentType = {
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
  CONTRACT: "CONTRACT",
  TEMPORARY: "TEMPORARY",
  INTERN: "INTERN",
  FREELANCE: "FREELANCE",
} as const;
export type EmploymentType =
  (typeof EmploymentType)[keyof typeof EmploymentType];

export const WorkMode = {
  ONSITE: "ONSITE",
  HYBRID: "HYBRID",
  REMOTE: "REMOTE",
} as const;
export type WorkMode = (typeof WorkMode)[keyof typeof WorkMode];

export const ApplicationStatus = {
  SAVED: "SAVED",
  APPLIED: "APPLIED",
  INTERVIEW: "INTERVIEW",
  OFFER: "OFFER",
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
