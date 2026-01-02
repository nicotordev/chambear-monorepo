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

import { useRouter } from "next/navigation";
import { useEffect } from "react";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get("step");
  const step = stepParam || "1";
  const { form, isLoading } = useOnboarding();

  useEffect(() => {
    if (isLoading) return;

    const values = form.getValues();

    // Check missing fields for each step
    const missingLocation =
      !values.name ||
      values.name.trim().split(/\s+/).length < 2 ||
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

    const missingExperience =
      !values.experiences || values.experiences.length === 0;

    let targetStep = "1";

    if (missingLocation) {
      targetStep = "1";
    } else if (missingPreferences) {
      targetStep = "2";
    } else if (missingProfile) {
      targetStep = "3";
    } else if (missingSkills) {
      targetStep = "4";
    } else if (missingExperience) {
      targetStep = "5";
    } else {
      // If everything else is done, Education is step 6.
      // We don't strictly enforce education present as it might be empty for some?
      // But typically we want at least one or explicit skip?
      // The backend check says educationsCount < 1 is missing.
      const missingEducation =
        !values.educations || values.educations.length === 0;
      if (missingEducation) {
        targetStep = "6";
      } else {
        // All done? Stay on 6 or maybe user is reviewing.
        // If user explicitly navigated, let them be?
        // But if just arrived, maybe 6.
        targetStep = "6";
      }
    }

    // Logic:
    // 1. If user just arrived (!stepParam), go to targetStep.
    // 2. If user is at a step > targetStep, it means they skipped a prerequisite. Force back to targetStep.
    // 3. If user is at a step <= targetStep, let them be (they might be editing previous info).

    const currentStepInt = parseInt(step, 10);
    const targetStepInt = parseInt(targetStep, 10);

    if (!stepParam) {
      if (step !== targetStep) {
        router.replace(`/onboarding-v2?step=${targetStep}`);
      }
    } else {
      // User has a step param. Enforce prerequisites.
      // If I am at Step 4, but Step 1 is missing (targetStep=1), I must go to 1.
      if (currentStepInt > targetStepInt) {
        router.replace(`/onboarding-v2?step=${targetStep}`);
      }
    }
  }, [isLoading, form, step, stepParam, router]);

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
        </div>
      </div>
    </FormProvider>
  );
}
