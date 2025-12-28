import Link from "next/link";
import { notFound } from "next/navigation";

import backend from "@/lib/backend";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import { ExternalLink, Sparkles, ArrowLeft } from "lucide-react";
import { Job } from "@/types";

type PageProps = {
  params: Promise<{ id: string }>;
};

function assertNonEmpty(value: string, name: string): string {
  const v = value.trim();
  if (v.length === 0) throw new Error(`${name} is required`);
  return v;
}

function clampScore(n: number): number {
  const v = Math.trunc(n);
  return Math.max(0, Math.min(100, v));
}

function pickDecision(score: number): { badge: string; cta: string } {
  if (score >= 75)
    return { badge: "Listo para aplicar", cta: "Optimizar y aplicar" };
  return {
    badge: "Requiere optimización",
    cta: "Optimizar CV para este puesto",
  };
}

async function getJob(id: string): Promise<Job | null> {
  try {
    const job = await backend.jobs.getById(id);
    return job;
  } catch {
    return null;
  }
}

export default async function JobPage({ params }: PageProps) {
  const { id } = await params;
  const jobId = assertNonEmpty(id, "params.id");

  const job = await getJob(jobId);
  if (!job) notFound();

  // Assuming the API returns 'fit' directly or via fitScores relation
  // If not available, default to 0
  const fitScore = job.fitScores?.[0]?.score ?? job.fit ?? 0;
  const fit = clampScore(fitScore);
  
  const decision = pickDecision(fit);

  return (
    <div className="px-4 py-6">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <Button asChild variant="outline">
          <Link href="/dashboard/jobs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>

        {job.externalUrl ? (
          <Button asChild variant="secondary">
            <Link href={job.externalUrl} target="_blank" rel="noreferrer">
              Ver oferta original
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : null}
      </div>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{job.title}</h1>
        <p className="text-sm text-muted-foreground">
          {job.company?.name ?? job.companyName}
          {job.location ? ` · ${job.location}` : ""}
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {/* Decision + CTA */}
        <Card className="md:col-span-2 border-primary/25">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Decisión</CardTitle>
            <CardDescription>
              Una acción clara, no una ficha técnica.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Fit estimado
              </span>
              <Badge variant={fit >= 75 ? "default" : "secondary"}>
                {decision.badge}
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Compatibilidad</span>
                <span className="font-medium">{fit}%</span>
              </div>
              <Progress value={fit} />
            </div>

            <Button asChild size="lg" className="w-full">
              <Link href={`/dashboard/jobs/${job.id}/optimize-cv`}>
                {decision.cta}
                <Sparkles className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Quick facts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resumen</CardTitle>
            <CardDescription>Lo mínimo útil.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ubicación</span>
              <span>{job.location ?? "Remoto / No especifica"}</span>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="text-muted-foreground">Tags</div>
              <div className="flex flex-wrap gap-2">
                {job.tags.length === 0 ? (
                  <Badge variant="secondary">Sin tags</Badge>
                ) : (
                  job.tags.slice(0, 10).map((t) => (
                    <Badge key={t} variant="outline">
                      {t}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Descripción</CardTitle>
          <CardDescription>
            Solo lo necesario para ajustar tu CV.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {job.description ?? "Sin descripción disponible."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}