import { Sparkles } from "lucide-react";
import DashboardCard from "@/components/dashboard-card";
import DashboardCarousel from "@/components/dashboard-carousel";
import JobCard from "@/components/job-card/job-card";
import type { Job } from "@/types";
import DashboardScanJobs from "./dashboard-scan-jobs";

interface DashboardRecommendedJobsProps {
  jobs: Job[];
}

export function DashboardRecommendedJobs({
  jobs,
}: DashboardRecommendedJobsProps) {
  const hasJobs = jobs && jobs.length > 0;

  return (
    <DashboardCard
      title={
        <span className="flex items-center gap-2">
          Recommended Jobs{" "}
          <Sparkles className="size-4 text-yellow-500 fill-yellow-500/20" />
        </span>
      }
      description="Our AI will find the best offers for you"
      cardContentClassName="pt-6"
      action={<DashboardScanJobs variant="icon" />}
    >
      {hasJobs ? (
        // Data State
        <div className="min-h-50">
          <DashboardCarousel
            slides={jobs.map((job) => (
              <div key={`rec-${job.id}`} className="px-1 py-2 h-full">
                <JobCard job={job} />
              </div>
            ))}
          />
        </div>
      ) : (
        // Initial / Empty State
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/25 bg-muted/5 py-10 text-center">
          <div className="mb-3 rounded-full bg-muted p-3">
            <Sparkles className="size-6 text-primary/60" />
          </div>
          <h3 className="text-sm font-medium text-foreground">
            Discover your next job
          </h3>
          <p className="mt-1 max-w-70 text-xs text-muted-foreground mb-4">
            Activate the scanner so our AI can search the web for offers based
            on your profile.
          </p>
          <DashboardScanJobs />
        </div>
      )}
    </DashboardCard>
  );
}
