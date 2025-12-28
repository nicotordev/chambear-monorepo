import type { Profile, User } from "@/types";
import { Sparkles } from "lucide-react";

interface DashboardHeaderProps {
  currentUser: User;
  currentProfile: Profile | undefined;
  activeApplicationsCount: number;
  hasInterview: boolean;
}

export function DashboardHeader({
  currentUser,
  currentProfile,
  activeApplicationsCount,
  hasInterview,
}: DashboardHeaderProps) {
  const firstName = currentUser.name?.split(" ")[0] || "Usuario";

  return (
    <div className="px-8 py-10 border-b border-border bg-card/30 backdrop-blur-sm shrink-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
            Hola,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-chart-2">
              {firstName}
            </span>
            ! 👋
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl text-pretty leading-relaxed">
            Tu panel de carrera está actualizado. Tienes{" "}
            <span className="text-foreground font-semibold">
              {activeApplicationsCount} postulaciones activas
            </span>
            {hasInterview ? (
              <>
                {" "}
                y una{" "}
                <span className="text-foreground font-semibold">
                  entrevista programada
                </span>{" "}
                próximamente.
              </>
            ) : (
              ". Sigue buscando oportunidades."
            )}
          </p>
        </div>

        {/* Status Badge */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-secondary/50 px-4 py-2 rounded-full border border-border/50 shadow-sm backdrop-blur-md">
            {currentProfile?.headline ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                {currentProfile.headline}
              </>
            ) : (
              <>
                <Sparkles className="size-3.5 text-yellow-500" />
                Completa tu perfil
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
