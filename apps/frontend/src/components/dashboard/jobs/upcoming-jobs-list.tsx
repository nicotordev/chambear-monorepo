"use client";

import { Briefcase, Building2 } from "lucide-react";
import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatEmploymentType } from "@/lib/utils";
import type { AlgoliaJob } from "@/types/algolia";

interface UpcomingJobsListProps {
  jobs: AlgoliaJob[];
}

export const UpcomingJobsList = memo(({ jobs }: UpcomingJobsListProps) => {
  return (
    <div className="hidden lg:flex flex-col w-80 border-r bg-card/50 h-full shrink-0">
      <div className="p-4 border-b shrink-0 flex items-center justify-between">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          Up Next ({jobs.length})
        </h3>
        <Badge variant="secondary" className="text-xs">
          Queue
        </Badge>
      </div>
      <ScrollArea className="p-0 max-w-full w-full [&>[data-slot=scroll-area-viewport]>div]:block!">
        <div className="flex flex-col divide-y divide-border/50">
          {jobs.length > 0 ? (
            jobs.map((job) => (
              <div
                key={job.objectID}
                className="p-4 hover:bg-muted/50 transition-colors cursor-default group"
              >
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-lg bg-background border flex items-center justify-center shrink-0">
                    {job.company?.logo ? (
                      <img
                        src={job.company.logo}
                        alt={job.companyName}
                        className="size-6 object-contain"
                      />
                    ) : (
                      <Building2 className="size-5 text-muted-foreground/50" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-3">
                      {job.title}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {job.companyName}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1 h-5">
                        {job.location || "Remote"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Briefcase className="size-3" />
                        {formatEmploymentType(job.employmentType)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <p>No more upcoming jobs in this batch.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
});

UpcomingJobsList.displayName = "UpcomingJobsList";
