"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useJobsPageStore } from "@/stores/jobs-page/jobs-page";
import type { Job } from "@/types";
import { Sparkles, ExternalLink } from "lucide-react";
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

  useEffect(() => {
    if (ssrJobs.length > 0) setJobs(ssrJobs);
  }, [ssrJobs, setJobs]);

  useEffect(() => {
    if (!selectedJobId && jobs.length > 0) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId, setSelectedJobId]);

  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === selectedJobId) ?? null,
    [jobs, selectedJobId]
  );

  if (!selectedJob) return null;

  const isReadyToApply = (selectedJob?.fit || 0) >= 75;

  return (
    <div className="p-8 space-y-8 max-w-3xl animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold leading-tight">
          {selectedJob.title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {selectedJob.company?.name ?? "Empresa Confidencial"} ·{" "}
          {selectedJob.location ?? "Remoto"}
        </p>
      </div>

      {/* Decision panel */}
      <div className="space-y-4 rounded-lg border p-4 bg-card/40">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Compatibilidad con tu perfil
          </span>
          <Badge variant={isReadyToApply ? "default" : "secondary"}>
            {isReadyToApply ? "Listo para aplicar" : "Requiere optimización"}
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Fit estimado</span>
            <span className="font-medium">{selectedJob?.fit ?? 0}%</span>
          </div>
          <Progress value={selectedJob?.fit ?? 0} />
        </div>

        {/* SINGLE PRIMARY ACTION */}
        <Button asChild size="lg" className="w-full">
          <Link href={`/dashboard/jobs/${selectedJob.id}`}>Ver oferta</Link>
        </Button>
      </div>

      {/* Context */}
      <div className="space-y-4">
        <h3 className="font-medium">Descripción</h3>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {selectedJob.description ?? "Sin descripción disponible."}
        </p>

        <div className="flex flex-wrap gap-2">
          {selectedJob.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Secondary action */}
      <div className="flex justify-start">
        <Button asChild variant="outline">
          <Link href={selectedJob.source} target="_blank" rel="noreferrer">
            Ver oferta original
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
