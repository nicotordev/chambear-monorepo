import JobCardMinimalWithFit from "@/components/dashboard/jobs/job-card-minimal-with-fit";
import SelectedJob from "@/components/dashboard/jobs/selected-job";
import { Button } from "@/components/ui/button";
import backend from "@/lib/backend";
import { SearchX, Sparkles } from "lucide-react"; // Importamos icono para estado vacío
import Link from "next/link";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const jobs = await backend.jobs.list().catch(() => []); // Catch para evitar crash si falla backend

  // 1. ESTADO VACÍO: Si no hay trabajos en la BD
  if (!jobs || jobs.length === 0) {
    return (
      <div className="flex flex-col h-[calc(100dvh-4rem)] items-center justify-center bg-background animate-in fade-in duration-500 space-y-4">
        <div className="bg-muted p-6 rounded-full">
          <SearchX className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">No jobs available</h2>
        <p className="text-muted-foreground max-w-md text-center">
          We haven't found any matching offers or the list is empty. Try
          reloading or searching manually.
        </p>
        <div className="flex gap-2">
          <Button>
            Search offers <Sparkles className="ml-2 h-4 w-4" />
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  // 2. LAYOUT NORMAL
  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] overflow-hidden bg-background animate-in fade-in duration-500">
      {/* Header */}
      <div className="pl-8 py-2 border-b bg-card/30 backdrop-blur-sm shrink-0">
        <h1 className="text-4xl font-bold tracking-tight">Jobs</h1>
        <p className="text-muted-foreground mt-2">
          Select a job and take action. Don't waste time browsing.
        </p>
      </div>

      {/* Main layout */}
      <div className="pl-8 flex items-stretch gap-4 overflow-x-hidden flex-1 h-full">
        {/* LEFT: Job list */}
        <div className="w-105 min-w-87.5 border-r overflow-y-scroll pr-8 pb-8 animate-in slide-in-from-left-4 duration-500">
          <div className="py-4 space-y-3">
            {jobs.map((job) => (
              <JobCardMinimalWithFit key={job.id} job={job} />
            ))}
          </div>
        </div>

        {/* RIGHT: Job detail */}
        <div className="flex-1 overflow-y-auto bg-background/50">
        <div>
          <SelectedJob ssrJobs={jobs} />
        </div>
        </div>
      </div>
    </div>
  );
}
