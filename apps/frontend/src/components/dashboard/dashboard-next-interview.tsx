import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InterviewSession, Job } from "@/types";
import { Calendar, Clock } from "lucide-react";

interface DashboardNextInterviewProps {
  interviews: InterviewSession[];
  jobs: Job[];
}

export function DashboardNextInterview({
  interviews,
  jobs,
}: DashboardNextInterviewProps) {
  const nextInterview = interviews[0];

  return (
    <div className="p-8 bg-chart-2/3">
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-bold text-xs uppercase tracking-widest text-chart-2 flex items-center gap-2">
          <Clock className="size-4" /> Próxima Entrevista
        </h3>
        <Badge variant="outline">En vivo pronto</Badge>
      </div>

      {interviews.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-baseline gap-2">
            <span className="text-7xl font-bold tracking-tighter leading-none">
              {nextInterview.scheduledFor?.getDate()}
            </span>
            <span className="text-xl font-bold text-muted-foreground uppercase">
              DIC
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold tracking-tight">
              {jobs.find((j) => j.id === nextInterview.jobId)?.title}
            </p>
            <p className="text-muted-foreground text-lg">
              {jobs.find((j) => j.id === nextInterview.jobId)?.company?.name}
            </p>
          </div>
          <Button className="w-full bg-chart-2 hover:bg-chart-2/90 text-white font-bold h-12 text-base rounded-xl shadow-lg shadow-chart-2/20">
            Unirse a la llamada
          </Button>
        </div>
      ) : (
        <div className="py-10 text-center">
          <Calendar className="size-10 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground font-medium">
            No hay entrevistas agendadas
          </p>
        </div>
      )}
    </div>
  );
}
