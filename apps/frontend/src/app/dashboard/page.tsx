import { DashboardActiveApplications } from "@/components/dashboard/dashboard-active-applications";
import { DashboardDocuments } from "@/components/dashboard/dashboard-documents";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardNextInterview } from "@/components/dashboard/dashboard-next-interview";
import { DashboardRecommendedJobs } from "@/components/dashboard/dashboard-recommended-jobs";
import { DashboardReminders } from "@/components/dashboard/dashboard-reminders";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import backend from "@/lib/backend";
import { auth } from "@clerk/nextjs/server";

// Next.js Optimizations
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getDashboardData() {
  try {
    const [user, jobs] = await Promise.all([
      backend.user.getMe(),
      backend.jobs.list(),
    ]);
    return { user, jobs };
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return { user: null, jobs: [] };
  }
}

export default async function DashboardPage() {
  const { user, jobs } = await getDashboardData();

  const { redirectToSignIn } = await auth();

  if (!user) {
    return redirectToSignIn();
  }

  // Data extraction with safe Fallbacks
  const currentProfile = user.profiles?.[0];
  const myApplications = user.applications ?? [];
  const myInterviews = user.interviewSessions ?? [];
  const myReminders = user.reminders ?? [];

  // Profile completion calculation
  let profileCompletion = 0;
  if (currentProfile) {
    if (currentProfile?.headline) profileCompletion += 20;
    if (currentProfile?.summary) profileCompletion += 20;
    if (currentProfile?.skills?.length ?? 0 > 0) profileCompletion += 20;
    if (currentProfile?.experiences?.length ?? 0 > 0) profileCompletion += 20;
    if (currentProfile?.educations?.length ?? 0 > 0) profileCompletion += 20;
  }

  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
      {/* 1. Fixed Top Header */}
      <DashboardHeader
        currentUser={user}
        currentProfile={currentProfile}
        activeApplicationsCount={myApplications.length}
        hasInterview={myInterviews.length > 0}
      />

      {/* 2. Main Area with Scroll */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Grid Container */}
        <div className="min-h-full w-full bg-border/50">
          {/* Main Grid Layout (Bento Box Style) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-px bg-border border-b border-border">
            {/* Row 1: Stats (Full Width) */}
            <DashboardStats
              applicationsCount={myApplications.length}
              interviewsCount={myInterviews.length}
              remindersCount={myReminders.length}
              profileCompletion={profileCompletion}
            />

            {/* Row 2: Main Content (Wide Left Column) */}
            <div className="lg:col-span-8 bg-background flex flex-col gap-px border-r border-border pb-12">
              {/* Block 1: Recommendations */}
              <DashboardRecommendedJobs jobs={jobs} />

              {/* Block 2: Active Applications */}
              <DashboardActiveApplications
                applications={myApplications}
                jobs={jobs}
              />
            </div>

            {/* Row 2: Sidebar Widgets (Narrow Right Column) */}
            <div className="lg:col-span-4 bg-background flex flex-col gap-px pb-16">
              {/* Widget 1: Next Interview (High Priority) */}
              <div className="bg-background">
                <DashboardNextInterview
                  interviews={myInterviews}
                  jobs={jobs}
                  profileId={currentProfile?.id}
                />
              </div>

              {/* Widget 2: Reminders */}
              <div className="bg-background">
                <DashboardReminders reminders={myReminders} />
              </div>

              {/* Widget 3: Documents */}
              <div className="bg-background">
                <DashboardDocuments />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
