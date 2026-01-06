import type { Metadata } from "next";
import { Suspense } from "react";
import OnboardingFlow from "@/components/pages/onboarding/onboarding-flow";

export const metadata: Metadata = {
  title: "Chambear - Onboarding",
};

export default function Onboarding() {
  return (
    <main className="w-full min-h-screen bg-muted/30">
      <OnboardingFlow />
    </main>
  );
}
