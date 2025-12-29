import { DashboardActiveApplications } from "@/components/dashboard/dashboard-active-applications";
import { DashboardDocuments } from "@/components/dashboard/dashboard-documents";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardNextInterview } from "@/components/dashboard/dashboard-next-interview";
import { DashboardRecommendedJobs } from "@/components/dashboard/dashboard-recommended-jobs";
import { DashboardReminders } from "@/components/dashboard/dashboard-reminders";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import backend from "@/lib/backend";

// Optimizaciones de Next.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getDashboardData() {
  try {
    const [user, jobs] = await Promise.all([
      backend.user.getMe(),
      backend.jobs.list(),
    ]);
    return { user, jobs };
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return { user: null, jobs: [] };
  }
}

export default async function DashboardPage() {
  const { user, jobs } = await getDashboardData();

  if (!user) {
    // Manejo básico de error de carga/autenticación
    return (
      <div className="flex h-screen items-center justify-center p-8 text-center text-muted-foreground">
        Error cargando el panel. Por favor recarga la página.
      </div>
    );
  }

  // Extracción de datos con Fallbacks seguros
  const currentProfile = user.profiles?.[0];
  const myApplications = user.applications ?? [];
  const myInterviews = user.interviewSessions ?? [];
  const myReminders = user.reminders ?? [];

  // Cálculo de completitud del perfil
  let profileCompletion = 0;
  if (currentProfile) {
    if (currentProfile?.headline) profileCompletion += 20;
    if (currentProfile?.summary) profileCompletion += 20;
    if (currentProfile?.skills?.length ?? 0 > 0) profileCompletion += 20;
    if (currentProfile?.experiences?.length ?? 0 > 0) profileCompletion += 20;
    if (currentProfile?.educations?.length ?? 0 > 0) profileCompletion += 20;
  }

  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
      {/* 1. Header Fijo Superior */}
      <DashboardHeader
        currentUser={user}
        currentProfile={currentProfile}
        activeApplicationsCount={myApplications.length}
        hasInterview={myInterviews.length > 0}
      />

      {/* 2. Área Principal con Scroll */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Container del Grid */}
        <div className="min-h-full w-full bg-border/50">
          {/* Grid Layout Principal (Bento Box Style) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-px bg-border border-b border-border">
            {/* Fila 1: Estadísticas (Ancho completo) */}
            <DashboardStats
              applicationsCount={myApplications.length}
              interviewsCount={myInterviews.length}
              remindersCount={myReminders.length}
              profileCompletion={profileCompletion}
            />

            {/* Fila 2: Contenido Principal (Columna Izquierda ancha) */}
            <div className="lg:col-span-8 bg-background flex flex-col gap-px border-r border-border pb-12">
              {/* Bloque 1: Recomendaciones */}
              <DashboardRecommendedJobs jobs={jobs} />

              {/* Bloque 2: Postulaciones Activas */}
              <DashboardActiveApplications
                applications={myApplications}
                jobs={jobs}
              />
            </div>

            {/* Fila 2: Sidebar Widgets (Columna Derecha estrecha) */}
            <div className="lg:col-span-4 bg-background flex flex-col gap-px pb-16">
              {/* Widget 1: Próxima Entrevista (Prioridad Alta) */}
              <div className="bg-background">
                <DashboardNextInterview interviews={myInterviews} jobs={jobs} />
              </div>

              {/* Widget 2: Recordatorios */}
              <div className="bg-background">
                <DashboardReminders reminders={myReminders} />
              </div>

              {/* Widget 3: Documentos */}
              <div className="bg-background">
                <DashboardDocuments />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
