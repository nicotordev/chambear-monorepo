"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useHits, useInstantSearch } from "react-instantsearch";
import { toast } from "sonner";
import { useUser } from "@/contexts/user-context";
import api from "@/lib/api";
import { useJobsPageStore } from "@/stores/jobs-page/jobs-page";
import type { AlgoliaJob } from "@/types/algolia";
import type { Job } from "@/types/db";

export function useJobSwipe() {
  const { items, results } = useHits<AlgoliaJob>();
  const { status } = useInstantSearch();
  const setJobs = useJobsPageStore((state) => state.setJobs);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { currentProfile } = useUser();

  useEffect(() => {
    if (results) {
      setJobs(items as unknown as Job[]);
    }
  }, [items, results, setJobs]);

  const handleSwipe = useCallback(
    async (direction: "left" | "right") => {
      const job = items[currentIndex];
      const profileId = currentProfile?.id;

      if (profileId && job) {
        const liked = direction === "right";
        try {
          await api.upsertJobPreference(job.objectID, profileId, liked);
          if (liked) {
            toast.success("Job saved!");
          }
        } catch (error) {
          console.error("Failed to save preference", error);
          toast.error("Failed to save action");
        }
      }

      setCurrentIndex((prev: number) => prev + 1);
    },
    [items, currentIndex, currentProfile?.id],
  );

  const handleReset = useCallback(() => {
    setCurrentIndex(0);
  }, []);

  const upcomingJobs = useMemo(
    () => items.slice(currentIndex + 1),
    [items, currentIndex],
  );
  const displayHits = useMemo(
    () => items.slice(currentIndex, currentIndex + 3).reverse(),
    [items, currentIndex],
  );
  const currentJob = items[currentIndex];

  const isLoading = status === "loading" || status === "stalled";

  return useMemo(
    () => ({
      items,
      currentIndex,
      currentJob,
      displayHits,
      upcomingJobs,
      handleSwipe,
      handleReset,
      hasMore: !!currentJob,
      totalHits: items.length,
      isLoading,
    }),
    [
      items,
      currentIndex,
      currentJob,
      displayHits,
      upcomingJobs,
      handleSwipe,
      handleReset,
      isLoading,
    ],
  );
}
