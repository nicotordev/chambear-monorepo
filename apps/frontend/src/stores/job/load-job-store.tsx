"use client";

import { useEffect } from "react";
import api from "@/lib/api";
import { useJobStore } from "./job.store";

export default function LoadJobStore() {
  const { setJobs } = useJobStore((state) => state);

  useEffect(() => {
    async function fetchJobs() {
      const jobs = await api.getJobs();
      setJobs(jobs);
    }
    fetchJobs();
  }, [setJobs]);

  return null;
}
