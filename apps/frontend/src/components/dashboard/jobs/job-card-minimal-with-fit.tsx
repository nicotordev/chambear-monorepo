"use client";

import type { Job } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useJobsPageStore } from "@/stores/jobs-page/jobs-page";

interface JobCardMinimalWithFitProps {
  job: Job;
}

export default function JobCardMinimalWithFit({
  job,
}: JobCardMinimalWithFitProps) {
  const setSelectedJobId = useJobsPageStore(state => state.setSelectedJobId);
  const selectedJobId = useJobsPageStore(state => state.selectedJobId);
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
          <span className="font-medium">10%</span>
        </div>
        <Progress value={10} />

        <div className="flex flex-wrap gap-1">
          {job.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
