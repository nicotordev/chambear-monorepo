"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { FormProvider } from "react-hook-form";
import { CertificationStep } from "@/components/onboarding-v2/certification-step";
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

export default function OnboardingWrapper() {
  return (
    <OnboardingProvider>
      <Suspense fallback={null}>
        <OnboardingContent />
      </Suspense>
    </OnboardingProvider>
  );
}

import { useRouter } from "next/navigation";
import { useEffect } from "react";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get("step");
  const step = stepParam || "1";
  const {
    form,
    isLoading: isUserLoading,
    isPending: isSaving,
    isReady,
  } = useOnboarding();

  useEffect(() => {
    // Only run this logic if we're fully ready and stable
    if (!isReady) return;

    const values = form.getValues();

    // Check missing fields for each step
    const missingLocation =
      !values.name ||
      values.name.length < 2 ||
      !values.location ||
      values.location.length < 2;

    const missingPreferences =
      !values.targetRoles || values.targetRoles.length === 0;

    const missingProfile =
      !values.headline ||
      values.headline.length < 5 ||
      !values.summary ||
      values.summary.length < 20 ||
      values.yearsExperience === undefined ||
      values.yearsExperience === null ||
      values.yearsExperience < 0 ||
      !values.avatar;

    const missingSkills = !values.skills || values.skills.length === 0;

    // We only require AT LEAST ONE of (Experience, Education, Certification)
    const hasHistory =
      (values.experiences && values.experiences.length > 0) ||
      (values.educations && values.educations.length > 0) ||
      (values.certifications && values.certifications.length > 0);

    let targetStep = "1";

    if (missingLocation) {
      targetStep = "1";
    } else if (missingPreferences) {
      targetStep = "2";
    } else if (missingProfile) {
      targetStep = "3";
    } else if (missingSkills) {
      targetStep = "4";
    } else if (!hasHistory) {
      // If no history at all, we start at step 5 (Experience)
      targetStep = "5";
    } else {
      // Default to current or 5
      targetStep = stepParam || "5";
    }

    const currentStepInt = parseInt(step, 10);
    const targetStepInt = parseInt(targetStep, 10);

    if (!stepParam) {
      if (step !== targetStep) {
        router.replace(`/onboarding-v2?step=${targetStep}`);
      }
    } else {
      // User has a step param. Enforce prerequisites.
      // If we are "saving", we might have temporary stale data.
      // The guard above (if isSaving return) already handles this.
      if (currentStepInt > targetStepInt && targetStepInt < 5) {
        // Only enforce strictly for the first 4 steps
        router.replace(`/onboarding-v2?step=${targetStep}`);
      }
    }
  }, [isReady, form, step, stepParam, router]);

  return (
    <FormProvider {...form}>
      <div className="min-h-screen bg-background flex flex-col items-center w-full px-4 md:px-8">
        <div className="flex flex-col lg:flex-row items-stretch justify-center gap-12 lg:gap-16 w-full max-w-7xl mx-auto h-full pt-20 lg:pt-32 pb-12">
          {step === "1" && <LocationStep />}
          {step === "2" && <PreferencesStep />}
          {step === "3" && <ProfileStep />}
          {step === "4" && <SkillsStep />}
          {step === "5" && <ExperienceStep />}
          {step === "6" && <EducationStep />}
          {step === "7" && <CertificationStep />}
        </div>
      </div>
    </FormProvider>
  );
}
