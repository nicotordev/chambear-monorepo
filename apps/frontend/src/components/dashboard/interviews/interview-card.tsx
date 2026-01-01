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
import { InterviewMode, type InterviewSession } from "@/types";
import {
  Building2,
  Clock,
  ExternalLink,
  MapPin,
  MoreVertical,
  Video,
} from "lucide-react";
import InterviewStatusBadge from "./interviews-status-badge";

// --- Componente de Tarjeta Individual ---
export interface InterviewCardProps {
  session: InterviewSession;
}

export default function InterviewCard({ session }: InterviewCardProps) {
  const job = session.job;
  const companyName =
    job?.company?.name ?? job?.companyName ?? "Unknown Company";
  const date = session.scheduledFor ? new Date(session.scheduledFor) : null;

  // Formateo de fecha
  const day = date ? date.getDate() : "--";
  const month = date
    ? date.toLocaleDateString("en-US", { month: "short" }).toUpperCase()
    : "---";
  const time = date
    ? date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  return (
    <Card className="group relative flex flex-col justify-between overflow-hidden transition-all hover:border-primary/50 hover:shadow-sm bg-background animate-in fade-in duration-500">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        {/* Badge de Estado */}
        <InterviewStatusBadge status={session.status} />

        {/* Menú de Acciones */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Edit details</DropdownMenuItem>
            <DropdownMenuItem>View Job</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              Cancel interview
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Bloque de Fecha y Título */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center justify-center rounded-lg border bg-secondary/30 px-3 py-2 text-center min-w-15">
            <span className="text-xs font-bold uppercase text-muted-foreground">
              {month}
            </span>
            <span className="text-2xl font-bold leading-none tracking-tight">
              {day}
            </span>
          </div>
          <div className="space-y-1 overflow-hidden">
            <h3
              className="font-semibold leading-none truncate"
              title={job?.title}
            >
              {job?.title ?? "Untitled Position"}
            </h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              <span className="truncate">{companyName}</span>
            </div>
          </div>
        </div>

        {/* Detalles Técnicos */}
        <div className="grid gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary/70" />
            <span>
              {time} hrs{" "}
              {session.durationMinutes
                ? `• ${session.durationMinutes} min`
                : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {session.mode === InterviewMode.ONSITE ? (
              <MapPin className="h-4 w-4 text-primary/70" />
            ) : (
              <Video className="h-4 w-4 text-primary/70" />
            )}
            <span className="capitalize">
              {session.mode ? session.mode.toLowerCase() : "Remote"}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        {session.meetLink ? (
          <Button className="w-full gap-2" asChild>
            <a
              href={session.meetLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Join call <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        ) : (
          <Button variant="outline" className="w-full" disabled>
            Link pending
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
