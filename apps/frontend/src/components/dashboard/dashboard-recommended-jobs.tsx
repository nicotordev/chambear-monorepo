import DashboardCard from "@/components/dashboard-card";
import DashboardCarousel from "@/components/dashboard-carousel";
import JobCard from "@/components/job-card/job-card";
import type { Job } from "@/types";
import { Button } from "../ui/button";
import { FolderSync } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface DashboardRecommendedJobsProps {
  jobs: Job[];
}

export function DashboardRecommendedJobs({
  jobs,
}: DashboardRecommendedJobsProps) {
  return (
    <DashboardCard
      title="Pegas Recomendadas"
      description="Basado en tu perfil y preferencias"
      cardContentClassName="pt-4"
      action={
        <Tooltip delayDuration={0}>
          <TooltipTrigger className="bg-primary text-primary-foreground p-2 rounded-full shadow-md">
            <FolderSync className="size-5" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Buscar pegas</p>
          </TooltipContent>
        </Tooltip>
      }
    >
      <DashboardCarousel
        slides={jobs.map((job) => (
          <JobCard key={`rec-${job.id}`} job={job} />
        ))}
      />
    </DashboardCard>
  );
}
