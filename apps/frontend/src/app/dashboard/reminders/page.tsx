import backend from "@/lib/backend";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Clock, PlusCircle } from "lucide-react";
import ReminderEmptyState from "@/components/dashboard/reviews/reminder-empty-state";
import ReminderCard from "@/components/dashboard/reviews/reminder-card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recordatorios | Chambear.ai",
  description: "Gestiona tus recordatorios con Chambear.ai",
};

export default async function RemindersPage() {
  const user = await backend.user.getMe();

  if (!user) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        Error cargando recordatorios. Intenta recargar.
      </div>
    );
  }

  const allReminders = user.reminders ?? [];

  // Separar pendientes de completados
  const pendingReminders = allReminders
    .filter((r) => !r.completedAt)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()); // Más urgentes primero

  const completedReminders = allReminders
    .filter((r) => r.completedAt)
    .sort(
      (a, b) =>
        new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
    ); // Más recientes primero

  return (
    <div className="flex h-full flex-col space-y-8 p-8 md:flex bg-background animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Recordatorios</h2>
          <p className="text-muted-foreground">
            No pierdas de vista tus seguimientos y tareas importantes.
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Recordatorio
        </Button>
      </div>

      {/* Tabs para Pendientes vs Historial */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full max-w-100 grid-cols-2">
          <TabsTrigger value="pending">
            Pendientes ({pendingReminders.length})
          </TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="pending" className="space-y-4">
            {pendingReminders.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingReminders.map((reminder) => (
                  <ReminderCard key={reminder.id} reminder={reminder} />
                ))}
              </div>
            ) : (
              <ReminderEmptyState
                message="¡Estás al día! No tienes tareas pendientes."
                icon={CheckCircle2}
              />
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {completedReminders.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-80">
                {completedReminders.map((reminder) => (
                  <ReminderCard key={reminder.id} reminder={reminder} />
                ))}
              </div>
            ) : (
              <ReminderEmptyState
                message="Aún no has completado ningún recordatorio."
                icon={Clock}
              />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
