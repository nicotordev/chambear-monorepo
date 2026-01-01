import type { ReminderType } from "@/types";
import { AlertTriangle, Bell, FileText, Mail } from "lucide-react";

export const getTypeConfig = (type: ReminderType) => {
  switch (type) {
    case "FOLLOW_UP": // Usando string literal por si el enum no está disponible en runtime
      return {
        label: "Follow-up",
        icon: Mail,
        style:
          "border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
      };
    case "INTERVIEW_PREP":
      return {
        label: "Preparation",
        icon: FileText,
        style:
          "border-purple-200 text-purple-700 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800",
      };
    case "DEADLINE":
      return {
        label: "Deadline",
        icon: AlertTriangle,
        style:
          "border-orange-200 text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800",
      };
    default:
      return {
        label: "General",
        icon: Bell,
        style: "border-border text-foreground bg-secondary",
      };
  }
};

export const getUrgencyState = (dateString: Date) => {
  const due = new Date(dateString);
  const now = new Date();

  // Resetear horas para comparar solo días
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(due);
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (due < now) {
    return {
      text: "Overdue",
      color: "text-red-600 font-bold",
      isOverdue: true,
    };
  }
  if (diffDays === 0) {
    return {
      text: "Due today",
      color: "text-amber-600 font-bold",
      isOverdue: false,
    };
  }
  if (diffDays === 1) {
    return { text: "Tomorrow", color: "text-blue-600", isOverdue: false };
  }

  return {
    text: `In ${diffDays} days`,
    color: "text-muted-foreground",
    isOverdue: false,
  };
};
