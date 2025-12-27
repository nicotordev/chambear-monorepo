import { DashboardActiveApplications } from "@/components/dashboard/dashboard-active-applications";
import { DashboardDocuments } from "@/components/dashboard/dashboard-documents";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardNextInterview } from "@/components/dashboard/dashboard-next-interview";
import { DashboardRecommendedJobs } from "@/components/dashboard/dashboard-recommended-jobs";
import { DashboardReminders } from "@/components/dashboard/dashboard-reminders";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import api from "@/lib/api";

async function getDashboardData() {
  try {
    const [user, jobs] = await Promise.all([
      api.getUser(),
      api.getJobs()
    ]);
    return { user, jobs };
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return { user: null, jobs: [] };
  }
}

export default async function DashboardPage() {
  const { user, jobs } = await getDashboardData();

  if (!user) {
     // Handle case where user fetch fails or is not authenticated properly handled by middleware usually
     return <div className="p-8 text-center text-muted-foreground">Error loading dashboard. Please try refreshing.</div>;
  }

  const currentProfile = user.profile?.[0]; // Assuming user has at least one profile or using the first one
  const myApplications = user.applications ?? [];
  const myInterviews = user.interviewSessions ?? [];
  const myReminders = user.reminders ?? [];

  // Calculate profile completion (simplified logic based on available fields)
  let profileCompletion = 0;
  if (currentProfile) {
      if (currentProfile.headline) profileCompletion += 20;
      if (currentProfile.summary) profileCompletion += 20;
      if (currentProfile.skills && currentProfile.skills.length > 0) profileCompletion += 20;
      if (currentProfile.experiences && currentProfile.experiences.length > 0) profileCompletion += 20;
      if (currentProfile.educations && currentProfile.educations.length > 0) profileCompletion += 20;
  }

  return (
    <div className="h-full flex flex-col space-y-0 animate-in fade-in duration-700">
      <DashboardHeader
        currentUser={user}
        currentProfile={currentProfile}
        activeApplicationsCount={myApplications.length}
      />

      {/* Main Immersive Grid */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-px bg-border border-b border-border">
            <DashboardStats
              applicationsCount={myApplications.length}
              interviewsCount={myInterviews.length}
              remindersCount={myReminders.length}
              profileCompletion={profileCompletion}
            />

            {/* Main Content Area */}
            <div className="lg:col-span-8 bg-background p-0 md:border-r border-border">
              <div className="divide-y divide-border">
                <DashboardRecommendedJobs jobs={jobs} />
                <DashboardActiveApplications
                  applications={myApplications}
                  jobs={jobs}
                />
              </div>
            </div>

            {/* Sidebar Widgets Column */}
            <div className="lg:col-span-4 bg-background flex flex-col divide-y divide-border">
              <DashboardNextInterview
                interviews={myInterviews}
                jobs={jobs}
              />
              <DashboardReminders reminders={myReminders} />
              <DashboardDocuments />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}