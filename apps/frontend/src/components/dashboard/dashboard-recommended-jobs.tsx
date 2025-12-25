import DashboardCard from "@/components/dashboard-card";
import DashboardCarousel from "@/components/dashboard-carousel";
import JobCard from "@/components/job-card/job-card";
import type { Job } from "@/types";

interface DashboardRecommendedJobsProps {
  jobs: Job[];
}

export function DashboardRecommendedJobs({
  jobs,
}: DashboardRecommendedJobsProps) {
  return (
    <DashboardCard
      title="Pegas Recomendadas"
      description="Basado en tu perfil y preferencias"
      cardContentClassName="pt-4"
    >
      <DashboardCarousel
        slides={jobs.map((job) => (
          <JobCard key={`rec-${job.id}`} job={job} />
        ))}
      />
    </DashboardCard>
  );
}
