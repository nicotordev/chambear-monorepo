import type { Profile, User } from "@/types";

interface DashboardHeaderProps {
  currentUser: User;
  currentProfile: Profile | undefined;
  activeApplicationsCount: number;
}

export function DashboardHeader({
  currentUser,
  currentProfile,
  activeApplicationsCount,
}: DashboardHeaderProps) {
  return (
    <div className="px-8 py-10 border-b border-border bg-card/30 backdrop-blur-sm shrink-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
            Hola,{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-chart-2">
              {currentUser.name?.split(" ")[0]}
            </span>
            ! 👋
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl text-pretty leading-relaxed">
            Tu panel de carrera está actualizado. Tienes{" "}
            <span className="text-foreground font-semibold">
              {activeApplicationsCount} postulaciones activas
            </span>{" "}
            y una entrevista programada próximamente.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-secondary/80 px-4 py-2 rounded-full border border-border/50 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-chart-5 animate-pulse" />
            {currentProfile?.headline || "Perfil Profesional"}
          </div>
        </div>
      </div>
    </div>
  );
}
