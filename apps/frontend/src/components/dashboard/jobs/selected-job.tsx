"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useJobsPageStore } from "@/stores/jobs-page/jobs-page";
import type { Job } from "@/types";
import { ExternalLink, MousePointerClick } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo } from "react";

export interface SelectedJobProps {
  ssrJobs: Job[];
}

export default function SelectedJob({ ssrJobs }: SelectedJobProps) {
  const jobs = useJobsPageStore((s) => s.jobs);
  const selectedJobId = useJobsPageStore((s) => s.selectedJobId);
  const setSelectedJobId = useJobsPageStore((s) => s.setSelectedJobId);
  const setJobs = useJobsPageStore((s) => s.setJobs);

  // Sincronizar datos del servidor al store
  useEffect(() => {
    if (ssrJobs.length > 0) setJobs(ssrJobs);
  }, [ssrJobs, setJobs]);

  // Autoseleccionar el primero si no hay selección
  useEffect(() => {
    if (!selectedJobId && jobs.length > 0) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId, setSelectedJobId]);

  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === selectedJobId) ?? null,
    [jobs, selectedJobId]
  );

  // ESTADO VACÍO DEL PANEL DERECHO (Si no hay selección)
  if (!selectedJob) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 animate-in fade-in">
        <MousePointerClick className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">Selecciona una oferta</p>
        <p className="text-sm">
          Haz clic en una tarjeta de la izquierda para ver los detalles.
        </p>
      </div>
    );
  }

  const isReadyToApply = (selectedJob?.fit || 0) >= 75;

  return (
    <div className="p-8 space-y-8 max-w-3xl animate-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold leading-tight text-balance">
          {selectedJob.title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {selectedJob.company?.name ?? "Empresa Confidencial"} ·{" "}
          {selectedJob.location ?? "Remoto"}
        </p>
      </div>

      {/* Decision panel */}
      <div className="space-y-4 rounded-xl border p-5 bg-card/40 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground/80">
            Compatibilidad con tu perfil
          </span>
          <Badge variant={isReadyToApply ? "default" : "secondary"}>
            {isReadyToApply ? "Listo para aplicar" : "Requiere optimización"}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Fit estimado</span>
            <span className="font-medium text-foreground">
              {selectedJob?.fit ?? 0}%
            </span>
          </div>
          <Progress value={selectedJob?.fit ?? 0} className="h-2" />
        </div>

        {/* SINGLE PRIMARY ACTION */}
        <Button asChild size="lg" className="w-full font-semibold">
          <Link href={`/dashboard/jobs/${selectedJob.id}`}>
            Ver oferta completa
          </Link>
        </Button>
      </div>

      {/* Context */}
      <div className="space-y-4">
        <h3 className="font-medium text-lg">Descripción</h3>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {selectedJob.description ?? "Sin descripción disponible."}
        </p>

        {selectedJob.tags && selectedJob.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {selectedJob.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="px-2 py-0.5 text-xs"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Secondary action */}
      <div className="flex justify-start pt-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
        >
          <Link
            href={selectedJob.source || "#"}
            target="_blank"
            rel="noreferrer"
          >
            Ver en fuente original
            <ExternalLink className="ml-2 h-3 w-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
