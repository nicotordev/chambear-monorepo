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
    <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 bg-background"></div>
  );
}
