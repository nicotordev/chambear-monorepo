"use client";

import Logo from "@/components/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProfile } from "@/contexts/user-context";
import { useOnboarding } from "@/hooks/use-onboarding";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  GraduationCap,
  Loader2,
  Plus,
  Save,
  User,
  Award,
} from "lucide-react";
import { useRef, useState } from "react";
import { useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import OnboardingFlowStep1 from "./onboarding-flow-step-1";
import OnboardingFlowStep2 from "./onboarding-flow-step-2";
import OnboardingFlowStep3 from "./onboarding-flow-step-3";
import OnboardingFlowStep4 from "./onboarding-flow-step-4";
import OnboardingFlowStep5 from "./onboarding-flow-step-5";

const STEPS = [
  { id: 1, label: "Profile", icon: User, description: "Basic Info" },
  { id: 2, label: "Skills", icon: Cpu, description: "Roles & Tech" },
  { id: 3, label: "Experience", icon: Briefcase, description: "History" },
  { id: 4, label: "Education", icon: GraduationCap, description: "Studies" },
  { id: 5, label: "Certifications", icon: Award, description: "Credentials" },
];

export default function OnboardingFlow() {
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const { currentProfile, refreshProfile } = useProfile();
  const {
    form,
    currentStep,
    handleStep,
    totalSteps,
    onSubmit,
    isPending,
    profiles,
    selectedProfileId,
    selectProfile,
    isLoading,
  } = useOnboarding();

  // Ref to handle scroll on step change
  const topRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    async function uploadAvatar() {
      if (!file) throw new Error("No file selected");
      const data = await api.uploadAvatar(file);
      return data.url;
    }

    toast.promise(uploadAvatar(), {
      loading: "Uploading avatar...",
      success: (data) => {
        form.setValue("avatar", data);
        setProfilePic(data);
        return "Avatar uploaded!";
      },
      error: "Failed to upload avatar",
    });
  };

  const {
    fields: expFields,
    append: appendExp,
    remove: removeExp,
  } = useFieldArray({
    control: form.control,
    name: "experiences",
  });

  const {
    fields: eduFields,
    append: appendEdu,
    remove: removeEdu,
  } = useFieldArray({
    control: form.control,
    name: "educations",
  });

  const {
    fields: skillFields,
    append: appendSkill,
    remove: removeSkill,
  } = useFieldArray({
    control: form.control,
    name: "skills",
  });

  const progress = (currentStep / totalSteps) * 100;

  const scrollToTop = () => {
    // Small timeout to ensure DOM has updated
    setTimeout(() => {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const nextStep = async () => {
    const fieldsToValidate: any[] = [];
    if (currentStep === 1)
      fieldsToValidate.push(
        "headline",
        "summary",
        "location",
        "yearsExperience",
        "avatar"
      );
    else if (currentStep === 2) fieldsToValidate.push("targetRoles", "skills");
    else if (currentStep === 3) fieldsToValidate.push("experiences");
    else if (currentStep === 4) fieldsToValidate.push("educations");

    const isValid = await form.trigger(fieldsToValidate);

    if (isValid) {
      try {
        const upsertUserPromise = api.upsertUser({
          ...form.getValues(),
          id: currentProfile?.id,
        });
        toast.promise(upsertUserPromise, {
          loading: "Saving profile...",
          success: "Profile saved!",
          error: "Failed to save profile",
        });
        await upsertUserPromise;
        await refreshProfile();
        if (currentStep < totalSteps) {
          handleStep(currentStep + 1);
          scrollToTop();
        } else {
          await onSubmit();
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      toast.error("Please fill in all required fields");
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      handleStep(currentStep - 1);
      scrollToTop();
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!selectedProfileId && profiles.length > 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Logo size="lg" className="mb-8" />
        <Card className="w-full max-w-2xl border-muted/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Select Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {profiles.map((p) => (
              <Button
                key={p.id}
                variant="outline"
                className="flex h-auto flex-col items-center gap-2 py-6 transition-all hover:scale-[1.02] hover:bg-muted/50"
                onClick={() => selectProfile(p.id)}
              >
                <Avatar className="h-16 w-16 md:h-20 md:w-20">
                  <AvatarImage
                    src={p.avatar || undefined}
                    className="object-cover border-2border-foreground"
                  />
                  <AvatarFallback className="text-xl">
                    {p.headline?.[0] || "P"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-center gap-1">
                  <span className="font-semibold">
                    {p.headline || "Untitled Profile"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {p.targetRoles[0] || "General"}
                  </span>
                </div>
              </Button>
            ))}
            <Button
              variant="outline"
              className="group flex h-auto flex-col items-center gap-2 border-dashed py-6 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              onClick={() => selectProfile("new")}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary/20 md:h-20 md:w-20">
                <Plus className="h-8 w-8 opacity-50 transition-opacity group-hover:opacity-100" />
              </div>
              <span className="font-semibold">Create New Profile</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex w-full bg-background">
      {/* SIDEBAR */}
      <aside className="w-1/3 hidden md:flex flex-col justify-between p-8 bg-muted/30 border-r relative">
        <div className="space-y-8">
          <div className="flex flex-col gap-4">
            <Logo alignment="left" />
            {profiles.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 w-fit gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => selectProfile(null)}
              >
                <ChevronLeft className="h-4 w-4" />
                Switch Profile
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              {currentStep === 1 && "Let's get to know you."}
              {currentStep === 2 && "Your superpowers."}
              {currentStep === 3 && "Your journey."}
              {currentStep === 4 && "Your education."}
            </h1>
            <p className="text-muted-foreground text-lg">
              Step {currentStep} of {totalSteps}
            </p>
          </div>

          <div className="space-y-6 mt-10">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-4 transition-all duration-300",
                    isActive ? "opacity-100 translate-x-2" : "opacity-50"
                  )}
                >
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center border-2",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : isCompleted
                        ? "border-primary text-primary"
                        : "border-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p
                      className={cn(
                        "font-semibold",
                        isActive && "text-primary"
                      )}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </aside>

      {/* FORMULARIO */}
      <main className="flex-1 flex flex-col relative bg-card h-screen">
        <ScrollArea className="flex-0 max-h-full relative pb-24 min-h-full">
          {/* Invisible element to anchor scroll top */}
          <div ref={topRef} />

          <div className="p-8 md:p-12 max-w-3xl mx-auto">
            <Form {...form}>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
                {/* --- STEP 1: BASIC PROFILE --- */}
                {currentStep === 1 && (
                  <OnboardingFlowStep1
                    form={form}
                    profilePic={profilePic}
                    handleFileUpload={handleFileUpload}
                    fileInputRef={fileInputRef}
                  />
                )}

                {/* --- STEP 2: SKILLS AND ROLES --- */}
                {currentStep === 2 && (
                  <OnboardingFlowStep2
                    form={form}
                    appendSkill={appendSkill}
                    removeSkill={removeSkill}
                    skillFields={skillFields}
                  />
                )}

                {/* --- STEP 3: EXPERIENCE --- */}
                {currentStep === 3 && (
                  <OnboardingFlowStep3
                    form={form}
                    appendExp={appendExp}
                    removeExp={removeExp}
                    expFields={expFields}
                  />
                )}

                {/* --- STEP 4: EDUCATION --- */}
                {currentStep === 4 && (
                  <OnboardingFlowStep4
                    form={form}
                    appendEdu={appendEdu}
                    removeEdu={removeEdu}
                    eduFields={eduFields}
                  />
                )}
              </form>
            </Form>
          </div>
          {/* Footer Navigation */}
          <div className="absolute right-0 bottom-0 p-6 border-t bg-background/95 backdrop-blur flex justify-between items-center z-20 w-full">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 1 || isPending}
              className="pl-0 hover:pl-2 transition-all"
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Back
            </Button>

            <Button
              onClick={nextStep}
              disabled={isPending}
              className="min-w-36"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : currentStep === totalSteps ? (
                <>
                  Finish <Save className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Next <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
