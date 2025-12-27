import DashboardCard from "@/components/dashboard-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Application, Job } from "@/types";
import { ApplicationStatus } from "@/types/enums";
import { ArrowRight } from "lucide-react";

interface DashboardActiveApplicationsProps {
  applications: Application[];
  jobs: Job[];
}

export function DashboardActiveApplications({
  applications,
  jobs,
}: DashboardActiveApplicationsProps) {
  return (
    <DashboardCard
      title="Postulaciones Activas"
      description="Seguimiento de tus procesos"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {applications.slice(0, 4).map((app) => {
          const job = jobs.find((j) => j.id === app.jobId);
          return (
            <div
              key={app.id}
              className="group p-5 rounded-xl border border-border bg-card/50 hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="size-12 rounded-lg bg-background border flex items-center justify-center font-bold text-lg shadow-sm text-primary">
                  {job?.company?.name?.charAt(0)}
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] border-none px-2 py-0.5",
                    app.status === ApplicationStatus.INTERVIEW
                      ? "bg-chart-2/10 text-chart-2"
                      : "bg-chart-1/10 text-chart-1"
                  )}
                >
                  {app.status}
                </Badge>
              </div>
              <h4 className="font-bold text-base truncate pr-2">
                {job?.title}
              </h4>
              <p className="text-xs text-muted-foreground mb-4 truncate">
                {job?.company?.name} • {job?.location}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-1.5">
                  {[1, 2].map((u) => (
                    <div
                      key={u}
                      className="size-5 rounded-full border-2 border-background bg-muted"
                    />
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs hover:bg-primary/10 hover:text-primary"
                >
                  Detalles <ArrowRight className="ml-1 size-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
