import Link from "next/link";
import { notFound } from "next/navigation";

import api from "@/lib/api";
import { demoJobs, demoFitScores } from "@/data/demo";

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

type PageProps = {
  params: Promise<{ id: string }>;
};

type JobModel = {
  id: string;
  title: string;
  company: { name: string };
  location: string | null;
  description: string | null;
  tags: string[];
  source?: string | null;
  fit?: number; // 0..100
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

function safeString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item === "string") out.push(item);
  }
  return out;
}

function pickDecision(score: number): { badge: string; cta: string } {
  if (score >= 75)
    return { badge: "Listo para aplicar", cta: "Optimizar y aplicar" };
  return {
    badge: "Requiere optimización",
    cta: "Optimizar CV para este puesto",
  };
}

function findDemoJob(id: string): JobModel | null {
  const j = demoJobs.find((x) => x.id === id);
  if (!j) return null;

  const fit = demoFitScores.find((f) => f.jobId === id)?.score ?? 0;

  return {
    id: j.id,
    title: j.title,
    company: { name: j.company.name },
    location: j.location,
    description: j.description,
    tags: j.tags,
    source:
      "source" in j && typeof (j as { source?: unknown }).source === "string"
        ? (j as { source: string }).source
        : null,
    fit: clampScore(fit),
  };
}

async function getJob(id: string): Promise<JobModel | null> {
  // 1) intenta API real
  try {
    const raw = (await api.getJobById(id)) as unknown;
    const obj = raw as Record<string, unknown>;

    const title = safeString(obj.title) ?? "";
    const companyObj = (obj.company ?? {}) as Record<string, unknown>;
    const companyName = safeString(companyObj.name) ?? "";

    if (title.trim().length === 0 || companyName.trim().length === 0) {
      return findDemoJob(id);
    }

    const location = safeString(obj.location);
    const description = safeString(obj.description);
    const tags = safeStringArray(obj.tags);
    const source = safeString(obj.source);

    const fitFromApi = typeof obj.fit === "number" ? obj.fit : null;
    const fitFromDemo = demoFitScores.find((f) => f.jobId === id)?.score ?? 0;

    return {
      id,
      title,
      company: { name: companyName },
      location,
      description,
      tags,
      source,
      fit: clampScore(fitFromApi ?? fitFromDemo),
    };
  } catch {
    // 2) fallback demo
    return findDemoJob(id);
  }
}

export default async function JobPage({ params }: PageProps) {
  const { id } = await params;
  const jobId = assertNonEmpty(id, "params.id");

  const job = await getJob(jobId);
  if (!job) notFound();

  const fit = clampScore(job.fit ?? 0);
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

        {job.source ? (
          <Button asChild variant="secondary">
            <Link href={job.source} target="_blank" rel="noreferrer">
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
          {job.company.name}
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
