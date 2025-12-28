import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  description?: string;
  cardContentClassName?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}
export default function DashboardCard({
  title,
  description,
  cardContentClassName,
  children,
  action,
}: DashboardCardProps) {
  return (
    <Card className="w-full rounded-none border-none">
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {action}
      </CardHeader>
      <CardContent
        className={cn(cardContentClassName, "max-w-full overflow-hidden")}
      >
        {children}
      </CardContent>
    </Card>
  );
}
