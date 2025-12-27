import {
  ApplicationStatus,
  DocumentType,
  EmploymentType,
  InterviewMode,
  InterviewStatus,
  JobSource,
  ReminderType,
  Role,
  Seniority,
  SkillLevel,
  UrlKind,
  WorkMode,
} from "./enums";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  profile?: Profile[];
  applications?: Application[];
  fitScores?: FitScore[];
  documents?: Document[];
  interviewSessions?: InterviewSession[];
  reminders?: Reminder[];
}

export interface Profile {
  id: string;
  userId: string;
  avatar: string | null;
  headline: string | null;
  summary: string | null;
  location: string | null;
  yearsExperience: number | null;
  targetRoles: string[];
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  experiences?: Experience[];
  educations?: Education[];
  skills?: ProfileSkill[];
}

export interface Experience {
  id: string;
  profileId: string;
  title: string;
  company: string;
  startDate: Date;
  endDate: Date | null;
  current: boolean;
  summary: string | null;
  highlights: string[];
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
  profile?: Profile;
}

export interface Education {
  id: string;
  profileId: string;
  school: string;
  degree: string | null;
  field: string | null;
  startDate: Date | null;
  endDate: Date | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  profile?: Profile;
}

export interface Skill {
  id: string;
  name: string;
  createdAt: Date;
  profiles?: ProfileSkill[];
  jobs?: JobSkill[];
}

export interface ProfileSkill {
  profileId: string;
  skillId: string;
  level: SkillLevel | null;
  profile?: Profile;
  skill?: Skill;
}

export interface Job {
  id: string;
  title: string;
  companyName: string;
  location: string | null;
  seniority: Seniority;
  employmentType: EmploymentType;
  workMode: WorkMode;
  description: string | null;
  source: JobSource;
  urlKind: UrlKind;
  externalUrl: string | null;
  postedAt: Date | null;
  expiresAt: Date | null;
  rawData: JSONValue | null;
  createdAt: Date;
  updatedAt: Date;
  salary: string | null;
  tags: string[];
  companyId: string | null;
  applications?: Application[];
  fitScores?: FitScore[];
  jobSkills?: JobSkill[];
  documents?: Document[];
  interviews?: InterviewSession[];
  reminders?: Reminder[];
  company?: Company;
  fit?: number;
}

export type JSONValue =
  | string
  | number
  | boolean
  | { [x: string]: JSONValue | undefined }
  | JSONValue[]
  | null;

export interface FitScore {
  id: string;
  userId: string;
  jobId: string;
  score: number;
  rationale: JSONValue | null;
  createdAt: Date;
  user?: User;
  job?: Job;
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
  jobs?: Job[];
}

export interface JobSkill {
  jobId: string;
  skillId: string;
  job?: Job;
  skill?: Skill;
}

export interface Application {
  id: string;
  userId: string;
  jobId: string;
  status: ApplicationStatus;
  appliedAt: Date | null;
  notes: string | null;
  resumeDocumentId: string | null;
  coverLetterId: string | null;
  followUpAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  job?: Job;
  resumeDocument?: Document | null;
  coverLetter?: Document | null;
  reminders?: Reminder[];
}

export interface Document {
  id: string;
  userId: string;
  jobId: string | null;
  type: DocumentType;
  label: string;
  content: string;
  version: number;
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  job?: Job | null;
  applicationResume?: Application[];
  applicationCoverLetter?: Application[];
}

export interface FitScore {
  id: string;
  userId: string;
  jobId: string;
  score: number;
  rationale: JSONValue | null;
  createdAt: Date;
  user?: User;
  job?: Job;
}

export interface InterviewSession {
  id: string;
  userId: string;
  jobId: string;
  mode: InterviewMode;
  status: InterviewStatus;
  scheduledFor: Date | null;
  durationMinutes: number | null;
  notes: string | null;
  aiFeedback: JSONValue | null;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  job?: Job;
}

export interface Reminder {
  id: string;
  userId: string;
  jobId: string | null;
  applicationId: string | null;
  type: ReminderType;
  dueAt: Date;
  sentAt: Date | null;
  completedAt: Date | null;
  message: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  job?: Job | null;
  application?: Application | null;
}
