import DashboardCard from "@/components/dashboard-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

interface DashboardActiveApplicationsProps {
  applications: Application[];
  jobs: Job[];
  onAddApplication?: () => void; // Trigger para abrir el Modal Manual
}

const getStatusConfig = (status: ApplicationStatus) => {
  switch (status) {
    case ApplicationStatus.INTERVIEW:
      return {
        label: "Entrevista",
        className: "bg-orange-500/10 text-orange-600 border-orange-200",
      };
    case ApplicationStatus.OFFER:
      return {
        label: "Oferta",
        className: "bg-green-500/10 text-green-600 border-green-200",
      };
    case ApplicationStatus.REJECTED:
      return {
        label: "Descartado",
        className: "bg-red-500/10 text-red-600 border-red-200",
      };
    default:
      return {
        label: "Enviado",
        className: "bg-blue-500/10 text-blue-600 border-blue-200",
      };
  }
};

const getRelativeTime = (date: Date | string) => {
  return "Hace 2 días"; // Placeholder para lógica real de fecha
};

export function DashboardActiveApplications({
  applications,
  jobs,
  onAddApplication,
}: DashboardActiveApplicationsProps) {
  const hasApplications = applications.length > 0;

  return (
    <DashboardCard
      title={
        <span className="flex items-center gap-2">
          Postulaciones Activas{" "}
          <Briefcase className="size-4 text-yellow-500 fill-yellow-500/20" />
        </span>
      }
      description="Seguimiento manual de tus procesos"
      action={
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className="h-8 w-8 rounded-full shadow-sm"
              onClick={onAddApplication} // Conectado
            >
              <PlusCircle className="size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Agregar postulación manual</p>
          </TooltipContent>
        </Tooltip>
      }
    >
      <div
        className={cn(
          "mt-4 gap-4",
          hasApplications ? "grid grid-cols-1 md:grid-cols-2" : "flex flex-col"
        )}
      >
        {hasApplications ? (
          applications.slice(0, 4).map((app) => {
            const job = jobs.find((j) => j.id === app.jobId);
            const statusConfig = getStatusConfig(app.status);

            if (!job) return null;

            return (
              <div
                key={app.id}
                className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm cursor-pointer"
              >
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
                    {job.company?.name || "Empresa Confidencial"} •{" "}
                    {job.location}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-dashed pt-3 mt-auto">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    <span>{getRelativeTime(app.createdAt || new Date())}</span>
                  </div>

                  <div className="flex items-center text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Ver detalles <ArrowRight className="ml-1 size-3" />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          // Empty State
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/25 bg-muted/5 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <CalendarDays className="size-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-semibold">
              Sin postulaciones activas
            </h3>
            <p className="mb-4 mt-2 max-w-xs text-xs text-muted-foreground">
              Lleva el registro de tus postulaciones externas aquí.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={onAddApplication} // Conectado
            >
              <PlusCircle className="mr-2 size-4" />
              Agregar Postulación
            </Button>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
