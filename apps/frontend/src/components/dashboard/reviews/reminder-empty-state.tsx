// --- Componente: Empty State ---

export interface ReminderEmptyStateProps {
  message: string;
  icon: any;
}

export default function ReminderEmptyState({ message, icon: Icon }: ReminderEmptyStateProps) {
  return (
    <div className="flex h-75 flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-muted/20 text-center animate-in fade-in-50">
      <div className="rounded-full bg-muted p-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground max-w-xs">{message}</p>
    </div>
  );
}
