"use client";

import { useOnboarding as useOnboardingHook } from "@/hooks/use-onboarding";
import { createContext, ReactNode, useContext } from "react";

type OnboardingContextType = ReturnType<typeof useOnboardingHook>;

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const onboarding = useOnboardingHook();
  return (
    <OnboardingContext.Provider value={onboarding}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
