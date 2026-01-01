import backend from "@/lib/backend";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  Clock,
  MapPin,
  MoreVertical,
  Video,
  Building2,
  ExternalLink,
} from "lucide-react";
import { PlusCircle } from "lucide-react";
import type { InterviewSession } from "@/types";
import { InterviewMode } from "@/types/enums";
import InterviewStatusBadge from "@/components/dashboard/interviews/interviews-status-badge";
import InterviewCard from "@/components/dashboard/interviews/interview-card";

export default async function InterviewsPage() {
  const user = await backend.user.getMe();

  if (!user) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        Error loading interviews. Try reloading.
      </div>
    );
  }

  const interviewSessions = user.interviewSessions ?? [];

  return (
    <div className="flex h-full flex-col space-y-8 p-8 md:flex bg-background animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Interviews</h2>
          <p className="text-muted-foreground">
            Manage your calendar and prepare for your meetings (
            {interviewSessions.length}).
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Schedule Interview
        </Button>
      </div>

      {/* Grid de Entrevistas */}
      {interviewSessions.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {interviewSessions.map((session) => (
            <InterviewCard key={session.id} session={session} />
          ))}
        </div>
      ) : (
        // Empty State
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center rounded-xl border border-dashed bg-muted/20">
          <div className="rounded-full bg-muted p-4">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              No interviews scheduled
            </h3>
            <p className="text-sm text-muted-foreground">
              You have no interviews in your calendar yet.
            </p>
          </div>
          <Button variant="outline">Schedule manually</Button>
        </div>
      )}
    </div>
  );
}