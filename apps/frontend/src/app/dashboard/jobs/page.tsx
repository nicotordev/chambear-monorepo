import AlgoliaJobsView from "@/components/dashboard/jobs/algolia-jobs-view";
import { Button } from "@/components/ui/button";
import backend from "@/lib/backend";
import { SearchX, Sparkles } from "lucide-react";
import Link from "next/link";

export default async function JobsPage() {
  const jobs = await backend.jobs.list().catch(() => []);

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

  return <AlgoliaJobsView initialJobs={jobs} />;
}
