"use client";

import api from "@/lib/api";
import { CreateProfileInput, CreateProfileSchema } from "@/schemas/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { SkillLevel } from "@/types";

export const useOnboarding = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null
  );
  const totalSteps = 4;

  const userDetails = useQuery({
    queryKey: ["user"],
    queryFn: () => api.getUser(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
  });

  const form = useForm<CreateProfileInput>({
    resolver: zodResolver(CreateProfileSchema) as Resolver<CreateProfileInput>,
    defaultValues: {
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
  });

  useEffect(() => {
    if (userDetails.isSuccess && userDetails.data) {
      const p = userDetails.data.profile || [];
      if (p.length === 0 && selectedProfileId !== "new") {
        setSelectedProfileId("new");
      }
    }
  }, [userDetails.isSuccess, userDetails.data]);

  useEffect(() => {
    if (!userDetails.data) return;

    if (selectedProfileId === "new") {
      form.reset({
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

    const currentProfile = userDetails.data.profile?.find(
      (p) => p.id === selectedProfileId
    );

    if (currentProfile) {
      form.reset({
        headline: currentProfile.headline ?? "",
        avatar: currentProfile.avatar ?? "",
        summary: currentProfile.summary ?? "",
        location: currentProfile.location ?? "",
        yearsExperience: currentProfile.yearsExperience ?? 0,
        targetRoles: currentProfile.targetRoles ?? [],
        skills:
          currentProfile.skills?.map((skill: any) => ({
            skillName: skill.skill?.name ?? skill.skillName ?? "",
            level: (skill.level as any) ?? SkillLevel.BEGINNER,
          })) ?? [],
        educations:
          currentProfile.educations?.map((education: any) => ({
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
          currentProfile.experiences?.map((experience: any) => ({
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
  }, [selectedProfileId, userDetails.data, form]);

  const mutation = useMutation({
    mutationFn: (data: CreateProfileInput) => {
      const payload =
        selectedProfileId && selectedProfileId !== "new"
          ? { ...data, id: selectedProfileId }
          : data;
      return api.upsertUser(payload);
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["user"] });
      router.refresh();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to update profile");
    },
  });

  const handleStep = (step: number) => {
    if (step < 1 || step > totalSteps) return;
    setCurrentStep(step);
  };

  const onSubmit = async (data: CreateProfileInput) => {
    mutation.mutate(data);
  };

  return {
    userDetails,
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isPending: mutation.isPending,
    currentStep,
    handleStep,
    totalSteps,
    profiles: userDetails.data?.profile || [],
    selectedProfileId,
    selectProfile: setSelectedProfileId,
    isLoading: userDetails.isLoading,
  };
};
