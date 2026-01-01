import DashboardCard from "@/components/dashboard-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import type { Application, Job } from "@/types";
import { ApplicationStatus } from "@/types/enums";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CalendarDays,
  Clock,
  PlusCircle,
} from "lucide-react";
import DashboardApplicationDialogAction from "../dashboard-application-dialog-action";
import NewApplicationDialog from "./applications/new-application-dialog";

interface DashboardActiveApplicationsProps {
  applications: Application[];
  jobs: Job[];
}

const getStatusConfig = (status: ApplicationStatus) => {
  switch (status) {
    case ApplicationStatus.INTERVIEW:
      return {
        label: "Interview",
        className: "bg-orange-500/10 text-orange-600 border-orange-200",
      };
    case ApplicationStatus.OFFER:
      return {
        label: "Offer",
        className: "bg-green-500/10 text-green-600 border-green-200",
      };
    case ApplicationStatus.REJECTED:
      return {
        label: "Rejected",
        className: "bg-red-500/10 text-red-600 border-red-200",
      };
    default:
      return {
        label: "Applied",
        className: "bg-blue-500/10 text-blue-600 border-blue-200",
      };
  }
};

export const getRelativeTime = (date: Date | string): string => {
  const now = new Date();
  const target = new Date(date);

  if (isNaN(target.getTime())) return "Invalid date";

  const diffInSeconds = (target.getTime() - now.getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const cutoffs = [
    { unit: "year", seconds: 31536000 },
    { unit: "month", seconds: 2592000 },
    { unit: "week", seconds: 604800 },
    { unit: "day", seconds: 86400 },
    { unit: "hour", seconds: 3600 },
    { unit: "minute", seconds: 60 },
  ];

  for (const { unit, seconds } of cutoffs) {
    if (Math.abs(diffInSeconds) >= seconds) {
      return rtf.format(
        Math.round(diffInSeconds / seconds),
        unit as Intl.RelativeTimeFormatUnit
      );
    }
  }

  return "Just now";
};

export function DashboardActiveApplications({
  applications,
  jobs,
}: DashboardActiveApplicationsProps) {
  const hasApplications = applications.length > 0;

  return (
    <DashboardCard
      title={
        <span className="flex items-center gap-2">
          Active Applications{" "}
          <Briefcase className="size-4 text-yellow-500 fill-yellow-500/20" />
        </span>
      }
      description="Manual tracking of your processes"
      action={<DashboardApplicationDialogAction />}
    >
      <div className="mt-4">
        {hasApplications ? (
          <Carousel
            opts={{
              align: "start",
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {applications.map((app) => {
                const job = jobs.find((j) => j.id === app.jobId);
                const statusConfig = getStatusConfig(app.status);

                if (!job) return null;

                return (
                  <CarouselItem
                    key={app.id}
                    className="pl-4 md:basis-1/2 lg:basis-1/2"
                  >
                    <div className="group relative flex h-full flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm cursor-pointer">
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex size-10 items-center justify-center rounded-lg border bg-muted/30 text-muted-foreground shadow-sm">
                          {job.company?.name ? (
                            <span className="text-lg font-bold text-primary">
                              {job.company.name.charAt(0).toUpperCase()}
                            </span>
                          ) : (
                            <Building2 className="size-5" />
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "px-2 py-0.5 text-[10px] font-medium border",
                            statusConfig.className
                          )}
                        >
                          {statusConfig.label}
                        </Badge>
                      </div>

                      <div className="mb-4 space-y-1">
                        <h4
                          className="truncate font-semibold text-foreground"
                          title={job.title}
                        >
                          {job.title}
                        </h4>
                        <p className="truncate text-xs text-muted-foreground">
                          {job.company?.name || "Confidential Company"} •{" "}
                          {job.location}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-dashed pt-3 mt-auto">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="size-3.5" />
                          <span>{getRelativeTime(app.createdAt)}</span>
                        </div>

                        <div className="flex items-center text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                          View details <ArrowRight className="ml-1 size-3" />
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            {applications.length > 2 && (
              <div className="hidden md:block">
                <CarouselPrevious className="-left-12" />
                <CarouselNext className="-right-12" />
              </div>
            )}
          </Carousel>
        ) : (
          // Empty State
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/25 bg-muted/5 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <CalendarDays className="size-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-semibold">
              No active applications
            </h3>
            <p className="mb-4 mt-2 max-w-xs text-xs text-muted-foreground">
              Keep track of your external applications here.
            </p>
            <NewApplicationDialog>
              <Button variant="outline" size="sm" className="h-8">
                <PlusCircle className="mr-2 size-4" />
                Add Application
              </Button>
            </NewApplicationDialog>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
