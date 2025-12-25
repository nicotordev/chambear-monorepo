import { demoDashboardStats } from "@/data/demo";
import { cn } from "@/lib/utils";

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
    <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 bg-background">
      {demoDashboardStats(
        applicationsCount,
        interviewsCount,
        remindersCount,
        profileCompletion,
      ).map((stat, _i) => (
        <div
          key={stat.label}
          className="p-8 flex flex-col justify-between hover:bg-muted/30 transition-colors group cursor-default border-r border-border last:border-r-0"
        >
          <div className="flex items-center justify-between mb-6">
            <stat.icon className={cn("size-5", stat.color)} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {stat.label}
            </span>
          </div>
          <div>
            <div className="text-4xl font-bold tracking-tighter">
              {stat.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
