"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useJobsPageStore } from "@/stores/jobs-page/jobs-page";
import type { Job } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface JobCardMinimalWithFitProps {
  job: Job;
}

export default function JobCardMinimalWithFit({
  job,
}: JobCardMinimalWithFitProps) {
  const setSelectedJobId = useJobsPageStore((state) => state.setSelectedJobId);
  const selectedJobId = useJobsPageStore((state) => state.selectedJobId);
  const isActive = job.id === selectedJobId;

  return (
    <Card
      onClick={() => setSelectedJobId(job.id)}
      className={`cursor-pointer transition border ${
        isActive ? "border-primary ring-1 ring-primary/40" : "hover:bg-muted/50"
      }`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm leading-tight">{job.title}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {job?.company?.name} · {job.location ?? "Remoto"}
        </p>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Fit</span>
          <span className="font-medium">{job.fit}%</span>
        </div>
        <Progress value={job.fit} />

        <div className="flex flex-wrap gap-1">
          {job.tags.slice(0, 3).map((tag) => (
            <Tooltip key={tag}>
              <TooltipTrigger asChild>
                <Badge
                  variant="secondary"
                  className="text-xs max-w-[150px] truncate block"
                >
                  {tag}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{tag}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
