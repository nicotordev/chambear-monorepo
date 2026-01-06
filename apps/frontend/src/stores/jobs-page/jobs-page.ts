"use client";

import { create } from "zustand";
import type { Job } from "@/types";

export interface JobsPageStore {
  jobs: Job[];
  setJobs: (jobs: Job[]) => void;
  selectedJobId: string;
  setSelectedJobId: (jobId: string) => void;
}

export const useJobsPageStore = create<JobsPageStore>((set) => ({
  jobs: [],
  setJobs: (jobs: Job[]) => set({ jobs }),
  selectedJobId: "",
  setSelectedJobId: (jobId: string) => set({ selectedJobId: jobId }),
}));
