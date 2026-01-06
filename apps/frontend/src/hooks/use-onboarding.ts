"use client";

import { useProfile } from "@/contexts/user-context";
import api from "@/lib/api";
import { type CreateProfileInput, CreateProfileSchema } from "@/schemas/user";
import { SkillLevel } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";

export const useOnboarding = () => {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const totalSteps = 7;

  const {
    user,
    profiles,
    isLoading: isUserLoading,
    isFetching,
    currentProfile,
  } = useProfile();

  const form = useForm<CreateProfileInput>({
    resolver: zodResolver(CreateProfileSchema) as Resolver<CreateProfileInput>,
    defaultValues: {
      name: "",
      headline: "",
      avatar: "",
      summary: "",
      location: "",
      yearsExperience: 0,
      targetRoles: [],
      skills: [],
      educations: [],
      experiences: [],
      certifications: [],
    },
    shouldUnregister: false,
  });

  useEffect(() => {
    setSelectedProfileId(currentProfile?.id || null);
  }, [currentProfile]);

  const mutation = useMutation({
    mutationFn: (data: CreateProfileInput) => {
      const payload =
        selectedProfileId && selectedProfileId !== "new"
          ? { ...data, id: selectedProfileId }
          : data;
      return api.upsertUser(payload);
    },
    onSuccess: (data: any) => {
      if (selectedProfileId === "new" && data?.id) {
        setSelectedProfileId(data.id);
      }
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["user"] });
      router.refresh();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to update profile");
    },
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: () => api.completeOnboarding(),
    onSuccess: () => {
      toast.success("Onboarding completed!");
      queryClient.invalidateQueries({ queryKey: ["user"] });
      router.refresh();
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Failed to complete onboarding"
      );
    },
  });

  useEffect(() => {
    if (!user || mutation.isPending) return;

    const currentValues = form.getValues();

    if (selectedProfileId === "new") {
      form.reset({
        name: currentValues.name || user?.name || "",
        headline: currentValues.headline || "",
        avatar: currentValues.avatar || "",
        summary: currentValues.summary || "",
        location: currentValues.location || "",
        yearsExperience: currentValues.yearsExperience || 0,
        targetRoles: currentValues.targetRoles || [],
        skills: currentValues.skills || [],
        educations: currentValues.educations || [],
        experiences: currentValues.experiences || [],
        certifications: currentValues.certifications || [],
      });
      return;
    }

    const currentProfileData = profiles?.find(
      (p) => p.id === selectedProfileId
    );

    if (currentProfileData) {
      form.reset({
        name: currentValues.name || user?.name || "",
        headline: currentValues.headline || currentProfileData.headline || "",
        avatar: currentValues.avatar || currentProfileData.avatar || "",
        summary: currentValues.summary || currentProfileData.summary || "",
        location: currentValues.location || currentProfileData.location || "",
        yearsExperience:
          currentValues.yearsExperience ||
          currentProfileData.yearsExperience ||
          0,
        targetRoles: currentValues.targetRoles?.length
          ? currentValues.targetRoles
          : currentProfileData.targetRoles || [],
        skills: currentValues.skills?.length
          ? currentValues.skills
          : currentProfileData.skills?.map((skill: any) => ({
              skillName: skill.skill?.name ?? skill.skillName ?? "",
              level: (skill.level as any) ?? SkillLevel.BEGINNER,
            })) ?? [],
        educations: currentValues.educations?.length
          ? currentValues.educations
          : currentProfileData.educations?.map((education: any) => ({
              school: education.school ?? "",
              degree: education.degree ?? "",
              field: education.field ?? "",
              startDate: education.startDate
                ? new Date(education.startDate)
                : undefined,
              endDate: education.endDate
                ? new Date(education.endDate)
                : undefined,
              description: education.description ?? "",
            })) ?? [],
        experiences: currentValues.experiences?.length
          ? currentValues.experiences
          : currentProfileData.experiences?.map((experience: any) => ({
              title: experience.title ?? "",
              company: experience.company ?? "",
              startDate: experience.startDate
                ? new Date(experience.startDate)
                : undefined,
              endDate: experience.endDate
                ? new Date(experience.endDate)
                : undefined,
              current: experience.current ?? false,
              summary: experience.summary ?? "",
              highlights: experience.highlights ?? [],
              location: experience.location ?? "",
            })) ?? [],
        certifications: currentValues.certifications?.length
          ? currentValues.certifications
          : currentProfileData.certifications?.map((cert: any) => ({
              name: cert.name ?? "",
              issuingOrganization: cert.issuingOrganization ?? "",
              issueDate: cert.issueDate ? new Date(cert.issueDate) : undefined,
              expirationDate: cert.expirationDate
                ? new Date(cert.expirationDate)
                : undefined,
              credentialId: cert.credentialId ?? "",
              credentialUrl: cert.credentialUrl ?? "",
            })) ?? [],
      });
    }
    setIsInitialized(true);
  }, [selectedProfileId, user, profiles, form.reset, mutation.isPending]);

  const handleStep = (step: number) => {
    if (step < 1 || step > totalSteps) return;
    setCurrentStep(step);
  };

  const onSubmit = async (data: CreateProfileInput, nextStep?: number) => {
    try {
      await mutation.mutateAsync(data);
      if (nextStep) {
        router.push(`/onboarding-v2?step=${nextStep}`);
      } else if (pathname === "/onboarding") {
        router.push("/");
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return {
    userDetails: { data: user, isLoading: isUserLoading },
    form,
    onSubmit: (_data: CreateProfileInput, nextStep?: number) =>
      form.handleSubmit((d) => onSubmit(d, nextStep))(),
    isPending:
      mutation.isPending ||
      completeOnboardingMutation.isPending ||
      (isFetching && !isInitialized),
    isReady:
      isInitialized && !isUserLoading && !isFetching && !mutation.isPending,
    currentStep,
    handleStep,
    totalSteps,
    profiles: profiles || [],
    selectedProfileId,
    selectProfile: setSelectedProfileId,
    isLoading: isUserLoading || (isFetching && !isInitialized),
    completeOnboarding: () => completeOnboardingMutation.mutateAsync(),
  };
};
