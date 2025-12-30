import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Reminder } from "@/types";
import { Bell, BellOff, BellPlus, Check, Clock } from "lucide-react";
import DashboardReminderCreation from "./dashboard-reminder-creation";

interface DashboardRemindersProps {
  reminders: Reminder[];
  onComplete?: (id: string) => void; // Callback para completar
}

export function DashboardReminders({
  reminders,
  onComplete,
}: DashboardRemindersProps) {
  const hasReminders = reminders && reminders.length > 0;

  // Helper para determinar el estado de urgencia
  const getUrgencyStyles = (date: Date) => {
    const now = new Date();
    const isPast = date < now;
    const isToday = date.toDateString() === now.toDateString();

    if (isPast) return "bg-red-500 ring-red-500/20";
    if (isToday) return "bg-amber-500 ring-amber-500/20";
    return "bg-blue-500 ring-blue-500/20";
  };

  return (
    <div className="flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Bell className="size-3.5" /> Recordatorios
          </h3>
          {hasReminders && (
            <Badge
              variant="secondary"
              className="flex size-5 items-center justify-center rounded-full p-0 text-[10px]"
            >
              {reminders.length}
            </Badge>
          )}
        </div>
        <DashboardReminderCreation>
          <Button variant="outline" size="icon">
            <BellPlus className="size-4 text-primary" />
          </Button>
        </DashboardReminderCreation>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {hasReminders ? (
          <div className="space-y-3">
            {reminders.map((reminder) => {
              const urgencyClass = getUrgencyStyles(reminder.dueAt);

              return (
                <div
                  key={reminder.id}
                  className="group relative flex items-start gap-3 rounded-xl border border-transparent bg-muted/40 p-3 transition-all hover:bg-background hover:border-border hover:shadow-sm"
                >
                  {/* Status Indicator */}
                  <div
                    className={cn(
                      "mt-1.5 size-2 rounded-full ring-4 shrink-0 transition-colors",
                      urgencyClass
                    )}
                  />

                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-snug text-foreground/90">
                      {reminder.message}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Clock className="size-3" />
                      <span>
                        {reminder.dueAt.toLocaleDateString("es-CL", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span>•</span>
                      <span>
                        {reminder.dueAt.toLocaleTimeString("es-CL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Action Button (Visible on Hover) */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-6 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2 h-6 w-6 rounded-full hover:bg-green-500/10 hover:text-green-600"
                    onClick={() => onComplete?.(reminder.id)}
                    title="Marcar como completado"
                  >
                    <Check className="size-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          // Empty State
          <div className="flex h-full flex-col items-center justify-center text-center py-6 opacity-80">
            <div className="mb-3 rounded-full bg-muted/50 p-3">
              <BellOff className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Todo al día</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-37.5">
              No tienes recordatorios pendientes. ¡Buen trabajo!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
