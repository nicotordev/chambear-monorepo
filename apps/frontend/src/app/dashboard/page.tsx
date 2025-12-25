import { DashboardActiveApplications } from "@/components/dashboard/dashboard-active-applications";
import { DashboardDocuments } from "@/components/dashboard/dashboard-documents";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardNextInterview } from "@/components/dashboard/dashboard-next-interview";
import { DashboardRecommendedJobs } from "@/components/dashboard/dashboard-recommended-jobs";
import { DashboardReminders } from "@/components/dashboard/dashboard-reminders";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import {
  demoApplications,
  demoInterviews,
  demoJobs,
  demoProfiles,
  demoReminders,
  demoUsers,
} from "@/data/demo";

export default function DashboardPage() {
  const currentUser = demoUsers[0];
  const currentProfile = demoProfiles.find((p) => p.userId === currentUser.id);
  const myApplications = demoApplications.filter(
    (a) => a.userId === currentUser.id,
  );
  const myInterviews = demoInterviews.filter(
    (i) => i.userId === currentUser.id,
  );
  const myReminders = demoReminders.filter((r) => r.userId === currentUser.id);

  // Calculate profile completion (mock logic)
  const profileCompletion = 85;

  return (
    <div className="h-full flex flex-col space-y-0 animate-in fade-in duration-700">
      <DashboardHeader
        currentUser={currentUser}
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
                <DashboardRecommendedJobs jobs={demoJobs} />
                <DashboardActiveApplications
                  applications={myApplications}
                  jobs={demoJobs}
                />
              </div>
            </div>

            {/* Sidebar Widgets Column */}
            <div className="lg:col-span-4 bg-background flex flex-col divide-y divide-border">
              <DashboardNextInterview
                interviews={myInterviews}
                jobs={demoJobs}
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
