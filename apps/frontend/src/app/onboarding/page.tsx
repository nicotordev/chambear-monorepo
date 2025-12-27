import OnboardingFlow from "@/components/pages/onboarding/onboarding-flow";
import { Suspense } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chambear - Onboarding",
};

export default function Onboarding() {
  return (
    <main className="w-full min-h-screen bg-muted/30">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen w-full">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/20" />
              <div className="text-muted-foreground text-sm">Loading your profile...</div>
            </div>
          </div>
        }
      >
        <OnboardingFlow />
      </Suspense>
    </main>
  );
}