import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCopy,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JobAiActions } from "@/components/dashboard/jobs/job-ai-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import backend from "@/lib/backend";
import type { Job } from "@/types";

type Rationale = {
  match?: string[];
  missing?: string[];
  reason?: string;
};

type FitModel = {
  score: number; // 0..100
  match: string[];
  missing: string[];
  reason?: string;
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

  const reason = typeof r.reason === "string" ? r.reason : undefined;

  return { match, missing, reason };
}

async function getJobById(jobId: string): Promise<Job | null> {
  try {
    const job = await backend.jobs.getById(jobId);
    return job;
  } catch {
    return null;
  }
}

function pickDecision(score: number): {
  label: "Apply Today" | "Iterate 15 min";
  hint: string;
} {
  if (score >= 80) {
    return {
      label: "Apply Today",
      hint: "You are well positioned. Generate CV + cover letter and apply.",
    };
  }
  if (score >= 60) {
    return {
      label: "Iterate 15 min",
      hint: "Close. Do the quick wins and re-generate.",
    };
  }
  return {
    label: "Iterate 15 min",
    hint: "Clear gaps. Adjust keywords and relevant experience.",
  };
}

function buildQuickWins(
  match: string[],
  missing: string[],
  jobTags: string[]
): string[] {
  const wins: string[] = [];

  // If we have missing critical skills, that's the #1 quick win
  if (missing.length > 0) {
    wins.push(`Highlight experience in: ${missing.slice(0, 3).join(", ")}`);
  }

  // If we have matches, we should reinforce them
  if (match.length > 0) {
    wins.push(`Quantify achievements using: ${match.slice(0, 2).join(", ")}`);
  }

  // Generic but high-impact advice
  wins.push("Tailor professional summary to include job keywords");
  wins.push("Ensure the first 3 bullets use strong action verbs");

  return wins;
}

function buildAtsRisks(score: number, missing: string[]): string[] {
  const risks: string[] = [];

  if (missing.length > 3) {
    risks.push(
      `Critical gaps: Missing ${missing.length} key keywords detected by ATS`
    );
  } else if (missing.length > 0) {
    risks.push(
      "Missing keywords: The ATS might filter your profile due to lack of technical terms"
    );
  }

  if (score < 70) {
    risks.push(
      "Low Fit Score: Your current profile doesn't stand out enough for this role"
    );
  }

  risks.push(
    "Format: Verify there are no tables or charts that confuse the ATS reader"
  );

  return risks;
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OptimizeCVforJob({ params }: PageProps) {
  const { id } = await params;
  const jobId = assertNonEmpty(id, "params.id");

  const job = await getJobById(jobId);
  if (!job) notFound();

  const user = await backend.user.getMe().catch(() => null);
  const profileId =
    user?.profiles?.[0]?.id || job.applications?.[0]?.profileId || "";

  // Extract fit score for the current profile
  const fitScore = job.fitScores?.find((fs) => fs.profileId === profileId);

  // If no fit score, we should show a prompt to calculate it
  if (!fitScore) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-500">
        <Card className="w-full max-w-lg border-2 border-dashed">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto size-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="size-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Analysis Pending</CardTitle>
            <CardDescription className="text-base">
              We haven't calculated the fit score for this position yet.
              Run the AI analysis to get personalized insights.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-4">
            <JobAiActions
              jobId={jobId}
              profileId={profileId}
              variant="default"
            />
            <Button asChild variant="ghost" className="w-full">
              <Link href={`/dashboard/jobs/${job.id}`}>
                <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                Back to Job Details
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const parsedRationale = parseRationale(fitScore.rationale);

  const fit: FitModel = {
    score: clampScore(fitScore.score ?? 0),
    match: parsedRationale.match ?? [],
    missing: parsedRationale.missing ?? [],
    reason: parsedRationale.reason,
  };

  const decision = pickDecision(fit.score);
  const quickWins = buildQuickWins(fit.match, fit.missing, job.tags);
  const atsRisks = buildAtsRisks(fit.score, fit.missing);

  return (
    <div className="h-full flex flex-col space-y-6 bg-background animate-in fade-in duration-500 overflow-y-auto">
      {/* Header */}
      <div className="px-8 pt-8 pb-0 shrink-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-balance">
              Optimize{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-chart-2">
                CV
              </span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl text-pretty">
              {job.title} at{" "}
              <span className="text-foreground font-semibold">
                {job.company?.name ?? job.companyName}
              </span>
              {job.location ? ` · ${job.location}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full shadow-sm"
            >
              <Link href={`/dashboard/jobs/${job.id}`}>
                <ArrowRight className="mr-2 h-4 w-4 rotate-180" /> Back
              </Link>
            </Button>
            <Button asChild size="sm" className="rounded-full shadow-sm">
              <Link href={`/dashboard/jobs/${job.id}/apply`}>
                Apply <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-8 pb-8 space-y-6">
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fit Score</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{fit.score}%</div>
              <Progress value={fit.score} className="h-2 mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {fit.reason || decision.hint}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Decision</CardTitle>
              <Zap className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold mb-2">
                <Badge
                  variant={
                    fit.score >= 80
                      ? "default"
                      : fit.score >= 60
                      ? "secondary"
                      : "destructive"
                  }
                  className="px-3 py-1 text-base"
                >
                  {decision.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Based on AI analysis of your profile match.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suggestions</CardTitle>
              <Sparkles className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{quickWins.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Quick wins identified to improve your chances.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (Main Analysis) */}
          <div className="lg:col-span-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Analysis</CardTitle>
                <CardDescription>
                  Review and optimize your profile based on these insights.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="quickwins" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="quickwins">Quick Wins</TabsTrigger>
                    <TabsTrigger value="ats">ATS Risks</TabsTrigger>
                    <TabsTrigger value="job">Job Role</TabsTrigger>
                  </TabsList>

                  <TabsContent value="quickwins" className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <Sparkles className="h-4 w-4" />
                        <span>High Impact Changes (15 min)</span>
                      </div>
                      <ul className="grid gap-3">
                        {quickWins.map((w) => (
                          <li
                            key={w}
                            className="flex items-start gap-3 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/50"
                          >
                            <CheckCircle2 className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Separator />
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                      <p className="text-sm text-muted-foreground">
                        Ready to apply changes?
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View Original CV
                        </Button>
                        <JobAiActions
                          jobId={jobId}
                          profileId={profileId}
                          variant="minimal"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="ats" className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Critical Issues Detected</span>
                      </div>
                      <ul className="grid gap-3">
                        {atsRisks.map((r) => (
                          <li
                            key={r}
                            className="flex items-start gap-3 text-sm text-muted-foreground bg-destructive/5 p-3 rounded-lg border border-destructive/10"
                          >
                            <div className="h-2 w-2 rounded-full bg-destructive mt-1.5 shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {fit.missing.length > 0 && (
                      <div className="rounded-xl border bg-card p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium">
                            Missing Keywords
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Copy list"
                          >
                            <ClipboardCopy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {fit.missing.slice(0, 15).map((k) => (
                            <Badge
                              key={k}
                              variant="secondary"
                              className="bg-muted hover:bg-muted/80"
                            >
                              {k}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="job" className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Role Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {job.tags.map((t) => (
                          <Badge key={`tag-${t}`} variant="outline">
                            {t}
                          </Badge>
                        ))}
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Job Description</h4>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground bg-muted/30 p-4 rounded-lg max-h-96 overflow-y-auto">
                          <p className="whitespace-pre-wrap leading-relaxed">
                            {job.description ?? "No description available."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skills Match</CardTitle>
                <CardDescription>
                  Comparison between your profile and the requirements.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-8 sm:grid-cols-2">
                  <div className="space-y-4">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-chart-2" />
                      Matched Skills
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

                  <div className="space-y-4">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-destructive" />
                      Missing Skills
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {fit.missing.length === 0 ? (
                        <Badge variant="secondary">
                          No critical gaps detected
                        </Badge>
                      ) : (
                        fit.missing.slice(0, 10).map((t) => (
                          <Badge key={`miss-${t}`} variant="destructive">
                            {t}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column (Widgets) */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="bg-gradient-to-br from-card to-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  AI Actions
                </CardTitle>
                <CardDescription>
                  Tools to boost your application.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <JobAiActions jobId={jobId} profileId={profileId} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exit Checklist</CardTitle>
                <CardDescription>Ensure you are ready.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors cursor-pointer">
                    <CheckCircle2 className="h-5 w-5 text-chart-1" />
                    <span className="text-sm font-medium">
                      Optimized CV (PDF)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed hover:border-solid hover:bg-muted/50 transition-all cursor-pointer opacity-70 hover:opacity-100">
                    <div className="h-5 w-5 rounded-full border-2 border-muted shrink-0" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Cover Letter (Optional)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed hover:border-solid hover:bg-muted/50 transition-all cursor-pointer opacity-70 hover:opacity-100">
                    <div className="h-5 w-5 rounded-full border-2 border-muted shrink-0" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Interview Questions
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}