import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Job } from "@/types";
import { Building2, MapPin } from "lucide-react";
import JobCardDetailButton from "./job-card-detail-button";
import JobCardDetailCVButton from "./job-card-detail-cv-button";

export interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  return (
    <Card className="w-full max-w-md h-full flex flex-col justify-between">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="line-clamp-1" title={job.title}>
              {job.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-1">
              <Building2 className="size-3" />
              {job?.company?.name || "N/A"}
            </CardDescription>
          </div>
          {job.postedAt && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(job.postedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            {job.employmentType.replace("_", " ")}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {job.workMode}
          </Badge>
        </div>
        {job.location && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3" />
            {job.location}
          </div>
        )}
        <p className="text-sm text-muted-foreground line-clamp-3">
          {job.description}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 w-full">
        <JobCardDetailButton job={job} />
        <JobCardDetailCVButton job={job} />
      </CardFooter>
    </Card>
  );
}
