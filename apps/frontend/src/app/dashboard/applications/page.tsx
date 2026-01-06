import { PlusCircle } from "lucide-react";
import { applicationColumns } from "@/components/dashboard/applications/applications-columns";
import { ApplicationsDataTable } from "@/components/dashboard/applications/applications-data-table";
import { Button } from "@/components/ui/button";
import backend from "@/lib/backend";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const user = await backend.user.getMe();

  if (!user) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        Error loading applications. Try reloading.
      </div>
    );
  }

  // Ensure it is an array
  const applications = user.applications ?? [];

  return (
    <div className="flex h-full flex-col space-y-8 px-8 pt-8 md:flex bg-background animate-in fade-in duration-500">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Applications</h2>
          <p className="text-muted-foreground">
            Manage and track the status of your applications (
            {applications.length}).
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Application
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-tr-xl rounded-tl-xl rounded-br-none rounded-bl-none border bg-card text-card-foreground shadow-sm">
        <ApplicationsDataTable
          columns={applicationColumns}
          data={applications}
        />
      </div>
    </div>
  );
}
