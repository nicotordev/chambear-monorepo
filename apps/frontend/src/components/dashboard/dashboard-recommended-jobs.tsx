import DashboardCard from "@/components/dashboard-card";
import DashboardCarousel from "@/components/dashboard-carousel";
import JobCard from "@/components/job-card/job-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Job } from "@/types";
import { Briefcase, FolderSearch, Loader2, Sparkles } from "lucide-react";
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
          Pegas Recomendadas{" "}
          <Sparkles className="size-4 text-yellow-500 fill-yellow-500/20" />
        </span>
      }
      description="Nuestra IA buscará las mejores ofertas para ti"
      cardContentClassName="pt-6"
      action={
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon">
              <FolderSearch className="size-4 text-primary" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="text-xs">Escanear nuevas pegas</p>
          </TooltipContent>
        </Tooltip>
      }
    >
      {hasJobs ? (
        // Estado con Datos
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
        // Estado Inicial / Vacío
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/25 bg-muted/5 py-10 text-center">
          <div className="mb-3 rounded-full bg-muted p-3">
            <Sparkles className="size-6 text-primary/60" />
          </div>
          <h3 className="text-sm font-medium text-foreground">
            Descubre tu próxima pega
          </h3>
          <p className="mt-1 max-w-70 text-xs text-muted-foreground mb-4">
            Activa el escáner para que nuestra IA busque ofertas en la web
            basadas en tu perfil.
          </p>
          <DashboardScanJobs />
        </div>
      )}
    </DashboardCard>
  );
}
