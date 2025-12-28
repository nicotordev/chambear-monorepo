import { cn } from "@/lib/utils";
import {
  Bell,
  Briefcase,
  ChevronRight,
  TrendingUp,
  User,
  Users,
  type LucideProps,
} from "lucide-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

interface DashboardStatsProps {
  applicationsCount: number;
  interviewsCount: number;
  remindersCount: number;
  profileCompletion: number;
}

export function DashboardStats({
  applicationsCount,
  interviewsCount,
  remindersCount,
  profileCompletion,
}: DashboardStatsProps) {
  return (
    <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
      {/* 1. Postulaciones */}
      <StatCard
        title="Postulaciones"
        value={applicationsCount}
        icon={Briefcase}
        description="En procesos activos"
        color="blue"
      />

      {/* 2. Entrevistas */}
      <StatCard
        title="Entrevistas"
        value={interviewsCount}
        icon={Users}
        description={interviewsCount > 0 ? "¡Prepárate bien!" : "Sin agendar"}
        color="purple"
        highlight={interviewsCount > 0}
      />

      {/* 3. Recordatorios */}
      <StatCard
        title="Recordatorios"
        value={remindersCount}
        icon={Bell}
        description="Tareas pendientes"
        color="amber"
        highlight={remindersCount > 0}
      />

      {/* 4. Perfil (Tarjeta Custom con Gráfico Circular) */}
      <div className="group relative flex flex-col justify-between overflow-hidden bg-background p-6 transition-colors hover:bg-secondary/20">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Nivel de Perfil
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">
                {profileCompletion}%
              </span>
            </div>
          </div>

          {/* Gráfico Circular SVG Puro */}
          <div className="relative size-12">
            <svg className="size-full -rotate-90" viewBox="0 0 36 36">
              {/* Fondo del círculo */}
              <path
                className="text-muted/20"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
              />
              {/* Progreso */}
              <path
                className={cn(
                  "transition-all duration-1000 ease-out",
                  profileCompletion === 100 ? "text-green-500" : "text-primary"
                )}
                strokeDasharray={`${profileCompletion}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <User className="size-4" />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          {profileCompletion === 100 ? (
            <span className="flex items-center text-green-600 font-medium">
              <TrendingUp className="mr-1 size-3" />
              ¡Estelar!
            </span>
          ) : (
            <span className="flex items-center group-hover:text-primary transition-colors cursor-pointer">
              Completar datos <ChevronRight className="ml-1 size-3" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Subcomponente para tarjetas estándar ---

interface StatCardProps {
  title: string;
  value: number;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  description: string;
  color: "blue" | "purple" | "amber" | "green";
  highlight?: boolean;
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  color,
  highlight = false,
}: StatCardProps) {
  const colorStyles = {
    blue: "text-blue-600 bg-blue-500/10",
    purple: "text-purple-600 bg-purple-500/10",
    amber: "text-amber-600 bg-amber-500/10",
    green: "text-green-600 bg-green-500/10",
  };

  return (
    <div className="group relative flex flex-col justify-between bg-background p-6 transition-colors hover:bg-secondary/20">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <h3 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            {value}
          </h3>
        </div>
        <div
          className={cn(
            "rounded-lg p-2 transition-all group-hover:scale-110",
            highlight ? colorStyles[color] : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
      <p className="mt-4 text-xs font-medium text-muted-foreground group-hover:text-foreground/80 transition-colors">
        {description}
      </p>
    </div>
  );
}
