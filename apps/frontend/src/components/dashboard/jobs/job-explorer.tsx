"use client";

import { AnimatePresence } from "framer-motion";
import { SearchX, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useJobSwipe } from "@/hooks/use-job-swipe";
import JobTinderCard from "./job-tinder-card";
import { UpcomingJobsList } from "./upcoming-jobs-list";

export function JobExplorer() {
  const {
    totalHits,
    displayHits,
    upcomingJobs,
    handleSwipe,
    handleReset,
    hasMore,
  } = useJobSwipe();

  if (totalHits === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="bg-muted p-4 rounded-full mb-4">
          <SearchX className="size-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No jobs found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search or filters.
        </p>
      </div>
    );
  }

  if (!hasMore) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="bg-muted p-4 rounded-full mb-4">
          <Sparkles className="size-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No more jobs for now</h3>
        <p className="text-muted-foreground mb-6">
          You've seen all the jobs in this search. Try a different location or
          category.
        </p>
        <Button onClick={handleReset} variant="outline">
          Start Over
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* LEFT SIDEBAR - UPCOMING JOBS */}
      <UpcomingJobsList jobs={upcomingJobs} />

      {/* RIGHT MAIN AREA - CARD STACK */}
      <div className="flex-1 flex flex-col relative bg-background/50">
        <div className="flex-1 flex items-center justify-center p-4 relative">
          <div className="relative w-full max-w-lg mx-auto h-full flex items-center justify-center">
            <AnimatePresence initial={false}>
              {displayHits.map((hit, index) => {
                const totalInStack = displayHits.length;
                const isTop = index === totalInStack - 1;
                const position = totalInStack - 1 - index;

                return (
                  <JobTinderCard
                    key={hit.objectID}
                    job={hit}
                    onSwipe={handleSwipe}
                    isTop={isTop}
                    stackIndex={position}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
