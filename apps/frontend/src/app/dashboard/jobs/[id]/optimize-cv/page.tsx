import DashboardCard from "@/components/dashboard-card";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCopy,
  LetterText,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";
import type { Job } from "@/types";

type PageProps = {
  params: Promise<{ id: string }>;
};

type Rationale = {
  match?: string[];
  missing?: string[];
};

type FitModel = {
  score: number; // 0..100
  match: string[];
  missing: string[];
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

function parseRationale(rationale: unknown): Rationale {
  if (typeof rationale !== "object" || rationale === null) {
    return { match: [], missing: [] };
  }
  
  const r = rationale as Record<string, unknown>;
  
  const match = Array.isArray(r.match) 
    ? r.match.filter((x): x is string => typeof x === "string")
    : [];
    
  const missing = Array.isArray(r.missing)
    ? r.missing.filter((x): x is string => typeof x === "string")
    : [];

  return { match, missing };
}

async function getJobById(jobId: string): Promise<Job | null> {
  try {
    const job = await api.getJobById(jobId);
    return job;
  } catch {
    return null;
  }
}

function pickDecision(score: number): {
  label: "Aplicar hoy" | "Iterar 15 min";
  hint: string;
} {
  if (score >= 80) {
    return {
      label: "Aplicar hoy",
      hint: "Estás bien posicionado. Genera CV + carta y manda.",
    };
  }
  if (score >= 60) {
    return {
      label: "Iterar 15 min",
      hint: "Te falta poco. Haz quick wins y re-genera.",
    };
  }
  return {
    label: "Iterar 15 min",
    hint: "Hay gaps claros. Ajusta keywords y experiencia relevante.",
  };
}

function buildQuickWins(tags: string[], missing: string[]): string[] {
  const wins: string[] = [];
  if (missing.length > 0)
    wins.push(
      `Agregar evidencia explícita de: ${missing.slice(0, 3).join(", ")}`
    );
  if (tags.length > 0)
    wins.push(
      `Alinear “Skills” del CV con tags: ${tags.slice(0, 4).join(", ")}`
    );
  wins.push("Reescribir bullets con impacto: métrica + acción + resultado");
  wins.push("Reordenar experiencia: lo más relevante arriba");
  return wins;
}

function buildAtsRisks(score: number, missing: string[]): string[] {
  const risks: string[] = [];
  if (missing.length > 0)
    risks.push(
      "Keywords faltantes (ATS): podrías quedar abajo en ranking automático"
    );
  if (score < 60)
    risks.push("Fit bajo: tu resumen y bullets no reflejan match con el rol");
  risks.push("Formato: evita tablas/columnas raras si vas a aplicar por ATS");
  return risks;
}

export default async function OptimizeCVforJob({ params }: PageProps) {
  const { id } = await params;
  const jobId = assertNonEmpty(id, "params.id");

  const job = await getJobById(jobId);
  if (!job) notFound();

  // Extract fit score from the job relationship if available
  // Assuming the API returns a job with fitScores included
  const fitScore = job.fitScores?.[0]; // Taking the first score as current logic implies 1:1 or most recent
  
  const parsedRationale = parseRationale(fitScore?.rationale);

  const fit: FitModel = {
    score: clampScore(fitScore?.score ?? job.fit ?? 0),
    match: parsedRationale.match ?? [],
    missing: parsedRationale.missing ?? [],
  };

  const decision = pickDecision(fit.score);
  const quickWins = buildQuickWins(job.tags, fit.missing);
  const atsRisks = buildAtsRisks(fit.score, fit.missing);

  return (
    <div className="h-full flex flex-col space-y-0 animate-in fade-in duration-700">
      {/* Header */}
      <div className="px-8 py-10 border-b border-border bg-card/30 backdrop-blur-sm shrink-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
              Optimizar{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-chart-2">
                CV
              </span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl text-pretty leading-relaxed">
              {job.title} en{" "}
              <span className="text-foreground font-semibold">
                {job.company?.name ?? job.companyName}
              </span>
              {job.location ? ` · ${job.location}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              asChild
              variant="secondary"
              className="rounded-full shadow-sm"
            >
              <Link href={`/dashboard/jobs/${job.id}`}>
                <ArrowRight className="mr-2 h-4 w-4 rotate-180" /> Volver
              </Link>
            </Button>
            <Button asChild className="rounded-full shadow-sm">
              <Link href={`/dashboard/jobs/${job.id}/apply`}>
                Aplicar <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Immersive Grid */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-px bg-border border-b border-border">
            {/* Fit Score Stat (spanning all) */}
            <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 bg-background">
              <div className="p-8 flex flex-col justify-between hover:bg-muted/30 transition-colors group cursor-default border-r border-border">
                <div className="flex items-center justify-between mb-6">
                  <Target className="size-5 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Fit Score
                  </span>
                </div>
                <div>
                  <div className="text-4xl font-bold tracking-tighter">
                    {fit.score}%
                  </div>
                  <div className="mt-2">
                    <Progress value={fit.score} className="h-2" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    {decision.hint}
                  </p>
                </div>
              </div>

              <div className="p-8 flex flex-col justify-between hover:bg-muted/30 transition-colors group cursor-default border-r border-border">
                <div className="flex items-center justify-between mb-6">
                  <Zap className="size-5 text-chart-2" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Decisión
                  </span>
                </div>
                <div>
                  <Badge
                    variant={
                      fit.score >= 80
                        ? "default"
                        : fit.score >= 60
                        ? "secondary"
                        : "destructive"
                    }
                    className="text-lg px-4 py-1"
                  >
                    {decision.label}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-3">
                    Basado en el análisis de IA
                  </p>
                </div>
              </div>

              <div className="p-8 flex flex-col justify-between hover:bg-muted/30 transition-colors group cursor-default">
                <div className="flex items-center justify-between mb-6">
                  <Sparkles className="size-5 text-chart-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Sugerencias
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-bold tracking-tighter">
                    {quickWins.length} Quick Wins
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Para mejorar tu perfil hoy
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-8 bg-background p-0 md:border-r border-border">
              <div className="divide-y divide-border">
                <DashboardCard
                  title="Análisis Detallado"
                  description="Ajustes recomendados para pasar los filtros de selección."
                >
                  <Tabs defaultValue="quickwins" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                      <TabsTrigger value="quickwins">Quick wins</TabsTrigger>
                      <TabsTrigger value="ats">Riesgos ATS</TabsTrigger>
                      <TabsTrigger value="job">Puesto</TabsTrigger>
                    </TabsList>

                    <TabsContent value="quickwins" className="space-y-6">
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">
                          Iteración rápida (15 min)
                        </h4>
                        <ul className="grid gap-3">
                          {quickWins.map((w) => (
                            <li
                              key={w}
                              className="flex items-start gap-3 text-sm text-muted-foreground"
                            >
                              <CheckCircle2 className="h-5 w-5 text-chart-2 shrink-0" />
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-4">
                        <Button variant="secondary" size="sm">
                          Recalcular Fit Score
                        </Button>
                        <Button variant="outline" size="sm">
                          Ver CV anterior
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="ats" className="space-y-6">
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          Riesgos detectados
                        </h4>
                        <ul className="grid gap-3">
                          {atsRisks.map((r) => (
                            <li
                              key={r}
                              className="flex items-start gap-3 text-sm text-muted-foreground"
                            >
                              <div className="h-1.5 w-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {fit.missing.length > 0 && (
                        <div className="rounded-xl border bg-muted/30 p-4">
                          <div className="text-sm font-medium mb-3">
                            Keywords sugeridas (ATS)
                          </div>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {fit.missing.slice(0, 12).map((k) => (
                              <Badge
                                key={k}
                                variant="outline"
                                className="bg-background"
                              >
                                {k}
                              </Badge>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full bg-background"
                          >
                            Copiar lista{" "}
                            <ClipboardCopy className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="job" className="space-y-6">
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">
                          Keywords del Puesto
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {job.tags.map((t) => (
                            <Badge key={`tag-${t}`} variant="secondary">
                              {t}
                            </Badge>
                          ))}
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Descripción</h4>
                          <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                            {job.description ?? "Sin descripción disponible."}
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </DashboardCard>

                <DashboardCard
                  title="Match de Skills"
                  description="Comparativa entre tu perfil y los requerimientos."
                >
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-3">
                      <div className="text-sm font-medium flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-chart-2" />
                        Match
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(fit.match.length > 0
                          ? fit.match
                          : job.tags.slice(0, 5)
                        ).map((t) => (
                          <Badge
                            key={`match-${t}`}
                            variant="outline"
                            className="border-chart-2/50 text-chart-2 bg-chart-2/5"
                          >
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-sm font-medium flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-destructive" />
                        Faltantes
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {fit.missing.length === 0 ? (
                          <Badge variant="secondary">
                            Nada crítico detectado
                          </Badge>
                        ) : (
                          fit.missing.slice(0, 6).map((t) => (
                            <Badge key={`miss-${t}`} variant="destructive">
                              {t}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </DashboardCard>
              </div>
            </div>

            {/* Sidebar Widgets Column */}
            <div className="lg:col-span-4 bg-background flex flex-col divide-y divide-border">
              <DashboardCard
                title="Acciones IA"
                description="Herramientas para potenciar tu postulación."
              >
                <div className="space-y-3">
                  <Button className="w-full rounded-xl h-12">
                    Optimizar CV <Sparkles className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full rounded-xl h-12"
                  >
                    Generar Carta <LetterText className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </DashboardCard>

              <DashboardCard
                title="Checklist de Salida"
                description="Asegúrate de tener todo listo."
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                    <CheckCircle2 className="h-5 w-5 text-chart-1" />
                    <span className="text-sm font-medium">
                      CV optimizado (PDF)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 opacity-50">
                    <div className="h-5 w-5 rounded-full border-2 border-muted shrink-0" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Carta lista (opcional)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 opacity-50">
                    <div className="h-5 w-5 rounded-full border-2 border-muted shrink-0" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Preguntas de entrevista
                    </span>
                  </div>
                </div>
              </DashboardCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}