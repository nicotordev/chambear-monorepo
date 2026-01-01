"use client";

import { useProfile } from "@/contexts/user-context";
import api from "@/lib/api";
import { CreateProfileInput, CreateProfileSchema } from "@/schemas/user";
import { SkillLevel } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";

export const useOnboarding = () => {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null
  );
  const totalSteps = 4;

  const { user, profiles, isLoading: isUserLoading } = useProfile();

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
    },
    shouldUnregister: false,
  });

  useEffect(() => {
    if (user) {
      const p = profiles || [];

      // If no profiles, set to new
      if (p.length === 0 && selectedProfileId !== "new") {
        setSelectedProfileId("new");
        return;
      }

      // If profiles exist and none selected, select the most recent one
      if (p.length > 0 && !selectedProfileId) {
        // Sort by createdAt desc
        const sorted = [...p].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setSelectedProfileId(sorted[0].id);
      }
    }
  }, [user, profiles, selectedProfileId]);

  useEffect(() => {
    if (!user) return;

    if (selectedProfileId === "new") {
      form.reset({
        name: user?.name ?? "",
        headline: "",
        avatar: "",
        summary: "",
        location: "",
        yearsExperience: 0,
        targetRoles: [],
        skills: [],
        educations: [],
        experiences: [],
      });
      return;
    }

    const currentProfileData = profiles?.find(
      (p) => p.id === selectedProfileId
    );

    if (currentProfileData) {
      form.reset({
        name: user?.name ?? "",
        headline: currentProfileData.headline ?? "",
        avatar: currentProfileData.avatar ?? "",
        summary: currentProfileData.summary ?? "",
        location: currentProfileData.location ?? "",
        yearsExperience: currentProfileData.yearsExperience ?? 0,
        targetRoles: currentProfileData.targetRoles ?? [],
        skills:
          currentProfileData.skills?.map((skill: any) => ({
            skillName: skill.skill?.name ?? skill.skillName ?? "",
            level: (skill.level as any) ?? SkillLevel.BEGINNER,
          })) ?? [],
        educations:
          currentProfileData.educations?.map((education: any) => ({
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
        experiences:
          currentProfileData.experiences?.map((experience: any) => ({
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
      });
    }
  }, [selectedProfileId, user, profiles, form.reset]);

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

  const handleStep = (step: number) => {
    if (step < 1 || step > totalSteps) return;
    setCurrentStep(step);
  };

  const onSubmit = async (data: CreateProfileInput) => {
    try {
      await mutation.mutateAsync(data);
      if (pathname === "/onboarding") {
        router.push("/");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return {
    userDetails: { data: user, isLoading: isUserLoading },
    form,
    onSubmit: form.handleSubmit(onSubmit),
    completeOnboarding: completeOnboardingMutation.mutateAsync,
    isPending: mutation.isPending || completeOnboardingMutation.isPending,
    currentStep,
    handleStep,
    totalSteps,
    profiles: profiles || [],
    selectedProfileId,
    selectProfile: setSelectedProfileId,
    isLoading: isUserLoading,
  };
};
