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

interface DashboardRecommendedJobsProps {
  jobs: Job[];
  isLoading?: boolean; // Nuevo estado
  onScan?: () => void; // Acción para detonar el scraper
}

export function DashboardRecommendedJobs({
  jobs,
  isLoading = false,
  onScan,
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
            <Button
              variant="outline"
              size="icon"
              disabled={isLoading}
              onClick={onScan}
              className="size-8 rounded-full bg-background shadow-sm hover:bg-accent transition-all"
            >
              {isLoading ? (
                <Loader2 className="size-4 text-primary animate-spin" />
              ) : (
                <FolderSearch className="size-4 text-primary" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="text-xs">
              {isLoading ? "Buscando..." : "Escanear nuevas pegas"}
            </p>
          </TooltipContent>
        </Tooltip>
      }
    >
      {isLoading ? (
        // Estado de Carga (Skeleton UI)
        <div className="flex gap-4 overflow-hidden py-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="min-w-75 space-y-3 rounded-xl border p-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      ) : hasJobs ? (
        // Estado con Datos
        <div className="min-h-50">
          <DashboardCarousel
            slides={jobs.map((job) => (
              <div key={`rec-${job.id}`} className="px-1 py-2">
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
          <Button onClick={onScan} size="sm" className="gap-2">
            <FolderSearch className="size-4" />
            Escanear ahora
          </Button>
        </div>
      )}
    </DashboardCard>
  );
}
