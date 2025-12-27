"use client";

import api from "@/lib/api";
import {
  CreateProfileInput,
  CreateProfileSchema,
  CreateProfileSchemaInput,
  SkillLevel,
} from "@/schemas/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useOnboarding = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const userDetails = useQuery({
    queryKey: ["user"],
    queryFn: () => api.getUser(),
    // Data is fresh for 5 minutes, kept in cache for 24 hours
    staleTime: 1000 * 60 * 5, 
    gcTime: 1000 * 60 * 60 * 24,
  });

  const form = useForm<CreateProfileSchemaInput, any, CreateProfileInput>({
    resolver: zodResolver(CreateProfileSchema),
    defaultValues: {
      headline: "",
      summary: "",
      location: "",
      yearsExperience: 0,
      targetRoles: [],
      skills: [],
      educations: [],
      experiences: [],
    },
  });

  // Sync form with fetched data
  useEffect(() => {
    if (userDetails.isSuccess && userDetails.data) {
      const currentProfile = userDetails.data.profile?.[0]; // Assuming user has a profile array

      if (currentProfile) {
        form.reset({
          headline: currentProfile.headline ?? "",
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
              startDate: education.startDate ? new Date(education.startDate) : undefined,
              endDate: education.endDate ? new Date(education.endDate) : undefined,
              description: education.description ?? "",
            })) ?? [],
          experiences:
            currentProfile.experiences?.map((experience: any) => ({
              title: experience.title ?? "",
              company: experience.company ?? "",
              startDate: experience.startDate ? new Date(experience.startDate) : undefined,
              endDate: experience.endDate ? new Date(experience.endDate) : undefined,
              current: experience.current ?? false,
              summary: experience.summary ?? "",
              highlights: experience.highlights ?? [],
              location: experience.location ?? "",
            })) ?? [],
        });
      }
    }
  }, [userDetails.isSuccess, userDetails.data, form]);

  const mutation = useMutation({
    mutationFn: (data: CreateProfileInput) => api.upsertUser(data),
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
  };
};