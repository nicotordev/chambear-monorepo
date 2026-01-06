"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import api from "@/lib/api";
import { useJobStore } from "./job.store";

export default function LoadJobStore() {
  const { setJobs } = useJobStore((state) => state);
  const searchParams = useSearchParams();
  const search = searchParams.get("search");

  useEffect(() => {
    async function fetchJobs() {
      const jobs = await api.getJobs(search || undefined);
      setJobs(jobs);
    }
    fetchJobs();
  }, [setJobs, search]);

  return null;
}
