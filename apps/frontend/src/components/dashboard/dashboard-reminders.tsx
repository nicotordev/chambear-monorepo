import { Badge } from "@/components/ui/badge";
import type { Reminder } from "@/types";

interface DashboardRemindersProps {
  reminders: Reminder[];
}

export function DashboardReminders({ reminders }: DashboardRemindersProps) {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Recordatorios
        </h3>
        <Badge
          variant="secondary"
          className="rounded-full size-5 p-0 flex items-center justify-center text-[10px]"
        >
          {reminders.length}
        </Badge>
      </div>
      <div className="space-y-1">
        {reminders.map((reminder) => (
          <div
            key={reminder.id}
            className="flex items-start gap-4 p-4 rounded-xl hover:bg-secondary/50 transition-all group cursor-pointer border border-transparent hover:border-border"
          >
            <div className="mt-1.5 size-2 rounded-full bg-accent ring-4 ring-accent/10 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground/90 leading-snug group-hover:text-accent transition-colors">
                {reminder.message}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                {reminder.dueAt.toLocaleDateString()} •{" "}
                {reminder.dueAt.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
