"use client";

import { EducationStep } from "@/components/onboarding-v2/education-step";
import { ExperienceStep } from "@/components/onboarding-v2/experience-step";
import { LocationStep } from "@/components/onboarding-v2/location-step";
import { PreferencesStep } from "@/components/onboarding-v2/preferences-step";
import { ProfileStep } from "@/components/onboarding-v2/profile-step";
import { SkillsStep } from "@/components/onboarding-v2/skills-step";
import {
  OnboardingProvider,
  useOnboarding,
} from "@/contexts/onboarding-context";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { FormProvider } from "react-hook-form";

export default function OnboardingWrapper() {
  return (
    <OnboardingProvider>
      <Suspense fallback={null}>
        <OnboardingContent />
      </Suspense>
    </OnboardingProvider>
  );
}

function OnboardingContent() {
  const searchParams = useSearchParams();
  const step = searchParams.get("step") || "1";
  const { form } = useOnboarding();

  return (
    <FormProvider {...form}>
      <div className="min-h-screen bg-background flex flex-col items-center w-full">
        <div className="flex items-stretch justify-center gap-16 w-full max-w-7xl mx-auto h-full pt-32 pb-12">
          {step === "1" && <LocationStep />}
          {step === "2" && <PreferencesStep />}
          {step === "3" && <ProfileStep />}
          {step === "4" && <SkillsStep />}
          {step === "5" && <ExperienceStep />}
          {step === "6" && <EducationStep />}
        </div>
      </div>
    </FormProvider>
  );
}
