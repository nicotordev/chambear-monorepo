import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { InterviewStatus } from "@/types/enums";

export interface InterviewStatusBadgeProps {
  status: InterviewStatus;
}

export default function InterviewStatusBadge({
  status,
}: InterviewStatusBadgeProps) {
  const styles = {
    [InterviewStatus.SCHEDULED]:
      "bg-blue-500/10 text-blue-700 border-blue-200 hover:bg-blue-500/20",
    [InterviewStatus.COMPLETED]:
      "bg-green-500/10 text-green-700 border-green-200 hover:bg-green-500/20",
    [InterviewStatus.CANCELLED]:
      "bg-red-500/10 text-red-700 border-red-200 hover:bg-red-500/20",
    [InterviewStatus.PLANNING]:
      "bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-500/20",
  };

  // Fallback por seguridad
  const className =
    styles[status as keyof typeof styles] || styles[InterviewStatus.SCHEDULED];

  return (
    <Badge variant="outline" className={cn("capitalize", className)}>
      {status ? status.toLowerCase() : "Scheduled"}
    </Badge>
  );
}
