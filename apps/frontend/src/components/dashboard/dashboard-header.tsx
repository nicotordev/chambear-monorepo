import { Sparkles } from "lucide-react";
import Link from "next/link";
import type { Profile, User } from "@/types";
import { Button } from "../ui/button";

interface DashboardHeaderProps {
  currentUser: User;
  currentProfile: Profile | undefined;
  activeApplicationsCount: number;
  hasInterview: boolean;
}

export function DashboardHeader({
  currentUser,
  currentProfile,
  activeApplicationsCount,
  hasInterview,
}: DashboardHeaderProps) {
  const firstName = currentUser.name?.split(" ")[0] || "User";

  return (
    <div className="px-8 py-10 border-b border-border bg-card/30 backdrop-blur-sm shrink-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
            Hello,{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-chart-2">
              {firstName}
            </span>
            ! 👋
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl text-pretty leading-relaxed">
            Your career dashboard is up to date. You have{" "}
            <span className="text-foreground font-semibold">
              {activeApplicationsCount} active applications
            </span>
            {hasInterview ? (
              <>
                {" "}
                and an{" "}
                <span className="text-foreground font-semibold">
                  interview scheduled
                </span>{" "}
                soon.
              </>
            ) : (
              ". Keep looking for opportunities."
            )}
          </p>
        </div>

        {/* Status Badge */}
        <div className="hidden md:flex items-center gap-4">
          {currentProfile?.headline ? (
            <>
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-secondary/50 px-4 py-2 rounded-full border border-border/50 shadow-sm backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                {currentProfile.headline}
              </div>
            </>
          ) : (
            <>
              <Button asChild variant="outline">
                <Link href="/dashboard/profile">
                  <Sparkles className="size-3.5" />
                  Complete your profile
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
