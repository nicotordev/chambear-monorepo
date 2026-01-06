"use client";

import { motion } from "framer-motion";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useOnboarding } from "@/contexts/onboarding-context";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import type { CreateProfileInput } from "@/schemas/user";

export function ProfileStep() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = useFormContext<CreateProfileInput>();
  const { onSubmit, isPending: isSaving } = useOnboarding();
  const { getValues } = useFormContext<CreateProfileInput>();

  const avatar = useWatch({ control, name: "avatar" }) || "";
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const data = await api.uploadAvatar(file);
      setValue("avatar", data.url, { shouldDirty: true });
      toast.success("Avatar uploaded!");
    } catch (error) {
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(getValues(), 4);
        }}
        className="space-y-10 w-full lg:w-[60%] flex flex-col"
      >
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-4"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display leading-[1.1] text-foreground tracking-tight">
            Activate Your{" "}
            <span className="text-accent italic">Career Agent</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium leading-relaxed max-w-md">
            Welcome to JobPilot. Let's initialize your Agentic AI to navigate
            the 2026 job market, bypass ATS filters, and secure high-quality
            offers.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-6"
        >
          <div className="flex justify-center md:justify-start mb-8">
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-colors" />
              <Avatar className="w-32 h-32 border-2border-background shadow-2xl relative z-10">
                <AvatarImage
                  src={avatar || undefined}
                  className="object-cover"
                />
                <AvatarFallback className="bg-secondary flex flex-col items-center justify-center">
                  {isUploading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent"
                    />
                  ) : (
                    <Camera className="w-8 h-8 text-primary" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-accent text-accent-foreground p-2 rounded-xl shadow-lg z-20 group-hover:scale-110 transition-transform">
                <Upload className="w-4 h-4" />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
            </div>
          </div>

          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Professional Headline
              </label>
              <Input
                placeholder="e.g. Senior Product Designer"
                {...register("headline")}
                className={cn(
                  "h-14 bg-card/40 backdrop-blur-xl border-2 transition-all rounded-2xl text-lg",
                  errors.headline
                    ? "border-destructive/50 focus-visible:border-destructive"
                    : "border-border/50 focus-visible:border-primary",
                )}
              />
              {errors.headline && (
                <p className="text-xs font-bold text-destructive uppercase tracking-widest ml-1">
                  {errors.headline.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Years of Experience
                </label>
                <Input
                  type="number"
                  min="0"
                  {...register("yearsExperience", { valueAsNumber: true })}
                  className="h-14 bg-card/40 backdrop-blur-xl border-2 border-border/50 focus-visible:border-primary rounded-2xl text-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                About You
              </label>
              <Textarea
                placeholder="What drives you? Let's give your Agent some context."
                {...register("summary")}
                className={cn(
                  "min-h-37.5 bg-card/40 backdrop-blur-xl border-2 transition-all rounded-3xl text-lg p-6 resize-none",
                  errors.summary
                    ? "border-destructive/50 focus-visible:border-destructive"
                    : "border-border/50 focus-visible:border-primary",
                )}
              />
              {errors.summary && (
                <p className="text-xs font-bold text-destructive uppercase tracking-widest ml-1">
                  {errors.summary.message}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
        >
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/onboarding-v2?step=2")}
            className="w-full sm:w-auto h-16 px-8 text-lg rounded-full hover:bg-muted transition-all active:scale-95 text-muted-foreground order-2 sm:order-1"
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto h-16 px-10 text-lg bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 group order-1 sm:order-2"
          >
            {isSaving ? "Initializing Agent..." : "Activate Agent"}
            <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </form>

      <div className="hidden lg:flex relative h-125 lg:h-175 w-[35%] items-center justify-center">
        <div className="absolute inset-0 bg-secondary/10 rounded-[40px] border border-border/50 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_70%)] opacity-[0.03]" />

          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{
                y: [0, -15, 0],
                rotateZ: [0, 1, 0],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10"
            >
              <Card className="pt-0 w-85 overflow-hidden rounded-[32px] bg-background/40 backdrop-blur-3xl border-2 border-primary/20 shadow-2xl">
                <div className="relative h-64 w-full">
                  <Image
                    src="/assets/img/ai/onboarding-profile.webp"
                    alt="Agent Visualization"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-background/90 via-transparent to-transparent" />
                </div>

                <div className="p-8 space-y-6">
                  <div className="space-y-1">
                    <p className="text-lg font-bold">Sarah Chen</p>
                    <p className="text-sm text-muted-foreground">
                      Lead Security Engineer
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 p-3 bg-primary/5 rounded-2xl border border-primary/10">
                      <p className="text-[10px] text-primary font-bold uppercase tracking-wider">
                        Status
                      </p>
                      <p className="text-sm font-semibold">Verified</p>
                    </div>
                    <div className="space-y-1 p-3 bg-secondary/20 rounded-2xl border border-border/50">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                        Access
                      </p>
                      <p className="text-sm font-semibold">Tier 1</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50 flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <span>MEMBER SINCE 2024</span>
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
