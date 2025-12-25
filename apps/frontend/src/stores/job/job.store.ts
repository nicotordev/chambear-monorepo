"use client";

import type { Job } from "@/types";
import { create } from "zustand";

export interface JobStore {
  jobs: Job[];
  selectedJobDetail: Job | null;
  isSheetOpen: boolean;
  setSheetOpen: (isOpen: boolean) => void;
  setSelectedJobDetail: (jobDetail: Job | null) => void;
  setJobs: (jobs: Job[]) => void;
}

export const useJobStore = create<JobStore>((set) => ({
  jobs: [],
  selectedJobDetail: null,
  isSheetOpen: false,
  setSheetOpen: (isOpen: boolean) => set({ isSheetOpen: isOpen }),
  setSelectedJobDetail: (jobDetail: Job | null) =>
    set({ selectedJobDetail: jobDetail, isSheetOpen: !!jobDetail }),
  setJobs: (jobs: Job[]) => set({ jobs }),
}));
