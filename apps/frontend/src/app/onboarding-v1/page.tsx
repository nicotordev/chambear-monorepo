import OnboardingFlow from "@/components/pages/onboarding/onboarding-flow";
import { Suspense } from "react";
import { Metadata } from "next";

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
