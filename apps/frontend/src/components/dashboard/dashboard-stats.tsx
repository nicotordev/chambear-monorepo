import { cn } from "@/lib/utils";
import {
  Bell,
  Briefcase,
  ChevronRight,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import DashboardStatCard from "./dashboard-stat-card";
import Link from "next/link";

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
    <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
      {/* 1. Applications */}
      <DashboardStatCard
        title="Applications"
        value={applicationsCount}
        icon={Briefcase}
        description="Active processes"
        color="blue"
        href="/dashboard/applications"
      />

      {/* 2. Interviews */}
      <DashboardStatCard
        title="Interviews"
        value={interviewsCount}
        icon={Users}
        description={interviewsCount > 0 ? "Prepare well!" : "None scheduled"}
        color="purple"
        highlight={interviewsCount > 0}
        href="/dashboard/interviews"
      />

      {/* 3. Reminders */}
      <DashboardStatCard
        title="Reminders"
        value={remindersCount}
        icon={Bell}
        description="Pending tasks"
        color="amber"
        highlight={remindersCount > 0}
        href="/dashboard/reminders"
      />

      {/* 4. Profile (Custom Card with Circular Graph) */}
      <div className="group relative flex flex-col justify-between overflow-hidden bg-background p-6 transition-colors hover:bg-secondary/20">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Profile Level
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">
                {profileCompletion}%
              </span>
            </div>
          </div>

          {/* Pure SVG Circular Graph */}
          <div className="relative size-12">
            <svg className="size-full -rotate-90" viewBox="0 0 36 36">
              {/* Circle background */}
              <path
                className="text-muted/20"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
              />
              {/* Progress */}
              <path
                className={cn(
                  "transition-all duration-1000 ease-out",
                  profileCompletion === 100 ? "text-green-500" : "text-primary"
                )}
                strokeDasharray={`${profileCompletion}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <User className="size-4" />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          {profileCompletion === 100 ? (
            <span className="flex items-center text-green-600 font-medium">
              <TrendingUp className="mr-1 size-3" />
              Stellar!
            </span>
          ) : (
            <Link
              href="/onboarding"
              className="flex items-center group-hover:text-primary transition-colors cursor-pointer"
            >
              Complete data <ChevronRight className="ml-1 size-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}