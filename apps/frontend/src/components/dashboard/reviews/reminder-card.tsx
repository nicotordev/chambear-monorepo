import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { CheckCircle2 } from "lucide-react";
import type { Reminder } from "@/types";
import { getTypeConfig, getUrgencyState } from "@/lib/reminders";

export interface ReminderCardProps {
  reminder: Reminder;
}
export default function ReminderCard({ reminder }: ReminderCardProps) {
  const typeConfig = getTypeConfig(reminder.type);
  const urgency = getUrgencyState(reminder.dueAt);
  const TypeIcon = typeConfig.icon;

  // Contextual data (if the reminder is tied to a Job or App)
  const contextTitle = reminder.job?.title || reminder.job?.companyName;
  const contextCompany = reminder.job?.companyName;

  return (
    <Card
      className={cn(
        "flex flex-col justify-between transition-all hover:shadow-md",
        reminder.completedAt ? "bg-muted/30 border-muted" : "border-border",
        !reminder.completedAt &&
          urgency.isOverdue &&
          "border-red-200 bg-red-50/10 dark:bg-red-900/10"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Badge
            variant="outline"
            className={cn("gap-1.5 pl-1.5 pr-2.5 py-1", typeConfig.style)}
          >
            <TypeIcon className="h-3.5 w-3.5" />
            {typeConfig.label}
          </Badge>

          {!reminder.completedAt && (
            <span className={cn("text-xs font-medium", urgency.color)}>
              {urgency.text}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Message */}
        <div>
          <h3
            className={cn(
              "font-medium leading-snug",
              reminder.completedAt && "line-through text-muted-foreground"
            )}
          >
            {reminder.message || "No description"}
          </h3>
        </div>

        {/* Context (Job/Application) */}
        {(contextTitle || contextCompany) && (
          <div className="flex items-center gap-2 rounded-md bg-secondary/50 p-2 text-xs text-muted-foreground">
            <Briefcase className="h-3.5 w-3.5 shrink-0" />
            <div className="flex flex-col overflow-hidden">
              <span className="truncate font-medium text-foreground">
                {contextTitle}
              </span>
              {contextCompany && (
                <span className="truncate">{contextCompany}</span>
              )}
            </div>
          </div>
        )}

        {/* Date */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {reminder.completedAt ? "Completed on " : "Due on "}
            {new Intl.DateTimeFormat("en-US", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }).format(
              new Date(reminder.completedAt || reminder.dueAt)
            )}
          </span>
        </div>
      </CardContent>

      {!reminder.completedAt && (
        <CardFooter className="pt-2">
          <Button
            variant="outline"
            className="w-full gap-2 hover:bg-green-50 hover:text-green-700 hover:border-green-200 dark:hover:bg-green-900/20"
          >
            <CheckCircle2 className="h-4 w-4" />
            Mark as completed
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}