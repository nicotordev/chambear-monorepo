import { type ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import AppSidebarJobSearcher from "@/components/app-sidebar-job-searcher";
import JobCardProvider from "@/components/job-card/job-card-provider";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import LoadJobStore from "@/stores/job/load-job-store";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <JobCardProvider>
        <AppSidebar />

        <SidebarInset className="flex w-[calc(100dvw-var(--sidebar-width))] h-dvh overflow-hidden">
          <div className="flex flex-col gap-4 h-full">
            <header className="h-16 border-b border-border bg-background px-4 flex items-center gap-3 w-full max-w-full">
              <SidebarTrigger />
              <div className="h-6 w-px bg-border" />
              <div className="flex-1" />
              <AppSidebarJobSearcher />
            </header>

            <div className="w-full h-full">{children}</div>
          </div>
        </SidebarInset>
        <LoadJobStore />
      </JobCardProvider>
    </SidebarProvider>
  );
}
