import { PlanTier } from "../lib/generated";

export const CREDIT_COSTS = {
  JOB_SCAN: 1,
  CV_OPTIMIZATION: 5,
  COVER_LETTER: 3,
  INTERVIEW_SIMULATION: 10,
  SKILL_GAP_ANALYSIS: 5,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

export const TIER_LIMITS = {
  [PlanTier.FREE]: {
    maxDailyScans: 3,
    maxDocuments: 2,
    priority: "low",
  },
  [PlanTier.BASE]: {
    maxDailyScans: 20,
    maxDocuments: 10,
    priority: "normal",
  },
  [PlanTier.PRO]: {
    maxDailyScans: 100,
    maxDocuments: 50,
    priority: "high",
  },
  [PlanTier.RESULT]: {
    maxDailyScans: 500,
    maxDocuments: 200,
    priority: "ultra",
  },
} as const;
