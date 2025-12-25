"use client";

import type { Job } from "@/types";
import { create } from "zustand";

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
