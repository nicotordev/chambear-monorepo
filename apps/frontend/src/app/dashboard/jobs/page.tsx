import JobCardMinimalWithFit from "@/components/dashboard/jobs/job-card-minimal-with-fit";
import api from "@/lib/api";
import SelectedJob from "@/components/dashboard/jobs/selected-job";

export default async function JobsPage() {
  const jobs = await api.getJobs();
  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] overflow-hidden">
      {/* Header */}
      <div className="pl-8 py-2 border-b bg-card/30 backdrop-blur-sm">
        <h1 className="text-4xl font-bold tracking-tight">Trabajos</h1>
        <p className="text-muted-foreground mt-2">
          Selecciona un trabajo y actúa. No pierdas tiempo navegando.
        </p>
      </div>

      {/* Main layout */}
      <div className="pl-8 flex items-stretch gap-4 overflow-x-hidden">
        {/* LEFT: Job list */}
        <div className="w-105 border-r overflow-y-scroll pr-8 pb-8 animate-in fade-in duration-500">
          <div className="py-4 space-y-3">
            {jobs.map((job) => (
              <JobCardMinimalWithFit key={job.id} job={job} />
            ))}
          </div>
        </div>

        {/* RIGHT: Job detail */}
        <div className="flex-1 overflow-y-auto">
          <SelectedJob ssrJobs={jobs} />
        </div>
      </div>
    </div>
  );
}
