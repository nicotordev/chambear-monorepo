import { Calendar, Clock, Plus, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InterviewSession, Job } from "@/types";
import DashboardInterviewCreation from "./interviews/dashboard-interview-creation";

interface DashboardNextInterviewProps {
  interviews: InterviewSession[];
  jobs: Job[];
  profileId?: string;
}

export function DashboardNextInterview({
  interviews,
  jobs,
  profileId,
}: DashboardNextInterviewProps) {
  // Ensure we get the actual next interview (sort by date if necessary)
  const nextInterview =
    interviews && interviews.length > 0 ? interviews[0] : null;

  // Helpers for date formatting
  const getInterviewDateDetails = (dateString?: string | Date) => {
    if (!dateString) return { day: "--", month: "---", time: "--:--" };
    const date = new Date(dateString);

    return {
      day: date.getDate(),
      month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(), // JAN, FEB...
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isToday: new Date().toDateString() === date.toDateString(),
    };
  };

  const job = nextInterview
    ? jobs.find((j) => j.id === nextInterview.jobId)
    : null;
  const { day, month, time, isToday } = getInterviewDateDetails(
    nextInterview?.scheduledFor ?? undefined,
  );

  return (
    <div
      className={cn(
        "flex flex-col justify-between overflow-hidden p-6 transition-all",
        // If there is an interview, use a highlighted background (soft Primary), otherwise a neutral background
        nextInterview
          ? "bg-primary/5 border-primary/20"
          : "bg-card border-border",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3
          className={cn(
            "flex items-center gap-2 text-xs font-bold uppercase tracking-widest",
            nextInterview ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Clock className="size-4" />
          {nextInterview ? "Next Interview" : "Schedule"}
        </h3>
        <div className="flex items-center gap-2">
          {nextInterview && (
            <Badge
              variant={isToday ? "destructive" : "secondary"}
              className="animate-pulse"
            >
              {isToday ? "Today" : "Scheduled"}
            </Badge>
          )}
          <DashboardInterviewCreation jobs={jobs} profileId={profileId}>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Plus className="size-4" />
            </Button>
          </DashboardInterviewCreation>
        </div>
      </div>

      {nextInterview && job ? (
        <div className="space-y-6">
          {/* Date & Time Display */}
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center rounded-lg bg-background p-3 border shadow-sm min-w-20">
              <span className="text-4xl font-bold tracking-tighter leading-none text-foreground">
                {day}
              </span>
              <span className="text-sm font-bold text-muted-foreground uppercase">
                {month}
              </span>
            </div>

            <div className="space-y-1 py-1">
              <h4 className="font-bold text-xl tracking-tight line-clamp-2 leading-tight">
                {job.title}
              </h4>
              <p className="text-muted-foreground font-medium flex items-center gap-2">
                {job.company?.name || "Confidential Company"}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Clock className="size-3" /> {time}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            {nextInterview.meetLink ? (
              <Button
                className="w-full gap-2 font-semibold shadow-md"
                size="lg"
                asChild
              >
                <a
                  href={nextInterview.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Video className="size-4" />
                  Join call
                </a>
              </Button>
            ) : (
              <Button className="w-full" variant="outline" disabled>
                Link pending
              </Button>
            )}
            <p className="text-[10px] text-center text-muted-foreground mt-2 opacity-70">
              Make sure to be in a quiet place 5 min before.
            </p>
          </div>
        </div>
      ) : (
        // Empty State
        <div className="flex flex-col items-center justify-center py-8 text-center h-full">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Calendar className="size-8 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium text-foreground">
            You have no scheduled interviews
          </p>
          <div className="mt-4">
            <DashboardInterviewCreation jobs={jobs} profileId={profileId}>
              <Button variant="outline" size="sm">
                Schedule Interview
              </Button>
            </DashboardInterviewCreation>
          </div>
        </div>
      )}
    </div>
  );
}
