import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import type { Job } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { Building2, Calendar, DollarSign, MapPin } from "lucide-react";
import JobCardDetailButton from "./job-card-detail-button";
import JobCardDetailCVButton from "./job-card-detail-cv-button";

export interface JobCardProps {
  job: Job;
}

const formatEnum = (value: string) => {
  if (value === "UNKNOWN") return null;
  return value
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
};

export default function JobCard({ job }: JobCardProps) {
  const employmentType = formatEnum(job.employmentType);
  const workMode = formatEnum(job.workMode);

  return (
    <Card className="group relative flex h-full flex-col justify-between overflow-hidden border-border/50 bg-card transition-all duration-300 hover:shadow-xl hover:border-primary/50">
      <CardHeader className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <h3 className="font-semibold text-lg leading-tight tracking-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {job.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                {job.company?.logo ? (
                  <img
                    src={job.company.logo}
                    alt={job.company.name}
                    className="size-4 object-contain rounded-sm"
                  />
                ) : (
                  <Building2 className="size-3.5" />
                )}
                <span className="font-medium">
                  {job.companyName || job.company?.name || "Unknown Company"}
                </span>
              </div>
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-1">
            {job.postedAt && (
              <Badge
                variant="secondary"
                className="text-[10px] font-normal px-1.5 py-0.5 h-auto"
              >
                {formatDistanceToNow(new Date(job.postedAt), {
                  addSuffix: true,
                })}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-0 space-y-4 flex-1">
        <div className="flex flex-wrap gap-2">
          {employmentType && (
            <Badge
              variant="outline"
              className="bg-background/50 hover:bg-secondary/20 transition-colors cursor-default"
            >
              {employmentType}
            </Badge>
          )}
          {workMode && (
            <Badge
              variant="outline"
              className="bg-background/50 hover:bg-secondary/20 transition-colors cursor-default"
            >
              {workMode}
            </Badge>
          )}
          {job.salary && (
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 max-w-full"
            >
              <DollarSign className="size-3 mr-1 shrink-0" />
              <span className="truncate" title={job.salary}>
                {job.salary}
              </span>
            </Badge>
          )}
        </div>

        <div className="space-y-2 text-sm text-muted-foreground/80">
          {job.location && (
            <div className="flex items-center gap-2">
              <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="line-clamp-1">{job.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="size-3.5 shrink-0 text-muted-foreground" />
            <span>Added {new Date(job.createdAt).toLocaleDateString()}</span>
          </div>
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {job.description}
          </p>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-col gap-2 w-full mt-auto">
        <div className="w-full flex flex-col gap-2">
          <JobCardDetailButton job={job} />
          <JobCardDetailCVButton job={job} />
        </div>
      </CardFooter>

      {/* Decorative gradient blob */}
      <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-all duration-500" />
    </Card>
  );
}
