"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useOnboarding } from "@/contexts/onboarding-context";
import type { CreateProfileInput } from "@/schemas/user";

interface ExperienceEntry {
  title: string;
  company: string;
  location?: string;
  startDate: Date;
  endDate?: Date | null;
  current: boolean;
  summary?: string;
  highlights: string[];
}

export function ExperienceStep() {
  const router = useRouter();
  const { setValue, control, getValues } = useFormContext<CreateProfileInput>();
  const { onSubmit, isPending: isSaving } = useOnboarding();

  const experiences = (useWatch({ control, name: "experiences" }) ||
    []) as ExperienceEntry[];

  const addExperience = () => {
    const newExp: ExperienceEntry = {
      title: "",
      company: "",
      location: "",
      startDate: new Date(),
      endDate: null,
      current: false,
      summary: "",
      highlights: [],
    };
    setValue("experiences", [...experiences, newExp], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const updateExperience = (
    index: number,
    updates: Partial<ExperienceEntry>,
  ) => {
    const nextExps = [...experiences];
    nextExps[index] = { ...nextExps[index], ...updates };
    setValue("experiences", nextExps, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const removeExperience = (index: number) => {
    const currentExps = getValues("experiences") || [];
    setValue(
      "experiences",
      currentExps.filter((_, i) => i !== index),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const formatDateForInput = (date: any) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const data = getValues();
        await onSubmit(data, 6);
      }}
      className="contents"
    >
      <div className="space-y-10 w-full lg:w-[60%] flex flex-col">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-4"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display leading-[1.1] text-foreground tracking-tight">
            Construct Your{" "}
            <span className="text-accent italic">Career Matrix</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium leading-relaxed max-w-md">
            Every role is training data for your AI Agent. Share your
            professional journey to help JobPilot strategize your next
            breakthrough move.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-6"
        >
          <AnimatePresence mode="popLayout">
            {experiences.map((exp, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="p-6 md:p-8 border-2 border-border/50 bg-card/40 backdrop-blur-xl rounded-[32px] relative group overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-primary/20 group-hover:bg-primary transition-colors" />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    onClick={() => removeExperience(index)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>

                  <div className="grid gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Briefcase className="h-3 w-3" /> Job Title
                        </label>
                        <Input
                          placeholder="e.g. Lead Developer"
                          value={exp.title}
                          onChange={(e) =>
                            updateExperience(index, { title: e.target.value })
                          }
                          className="h-12 bg-background/50 border-2 border-transparent focus-visible:border-primary rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Building2 className="h-3 w-3" /> Company
                        </label>
                        <Input
                          placeholder="e.g. Acme Corp"
                          value={exp.company}
                          onChange={(e) =>
                            updateExperience(index, {
                              company: e.target.value,
                            })
                          }
                          className="h-12 bg-background/50 border-2 border-transparent focus-visible:border-primary rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-3 w-3" /> Start Date
                        </label>
                        <Input
                          type="date"
                          value={formatDateForInput(exp.startDate)}
                          onChange={(e) =>
                            updateExperience(index, {
                              startDate: e.target.value
                                ? new Date(e.target.value)
                                : undefined,
                            })
                          }
                          className="h-12 bg-background/50 border-2 border-transparent focus-visible:border-primary rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-3 w-3" /> End Date
                        </label>
                        <Input
                          type="date"
                          disabled={exp.current}
                          value={
                            exp.endDate instanceof Date
                              ? exp.endDate.toISOString().split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            updateExperience(index, {
                              endDate: e.target.value
                                ? new Date(e.target.value)
                                : null,
                            })
                          }
                          className="h-12 bg-background/50 border-2 border-transparent focus-visible:border-primary rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 bg-primary/5 p-4 rounded-xl border border-primary/10">
                      <Checkbox
                        id={`current-${index}`}
                        checked={exp.current}
                        onCheckedChange={(checked) =>
                          updateExperience(index, {
                            current: !!checked,
                            endDate: checked ? null : exp.endDate,
                          })
                        }
                      />
                      <label
                        htmlFor={`current-${index}`}
                        className="text-sm font-bold text-primary uppercase cursor-pointer select-none"
                      >
                        I CURRENTLY WORK HERE
                      </label>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Description & Key Wins
                      </label>
                      <Textarea
                        placeholder="What did you achieve?"
                        value={exp.summary}
                        onChange={(e) =>
                          updateExperience(index, { summary: e.target.value })
                        }
                        className="min-h-25 bg-background/50 border-2 border-transparent focus-visible:border-primary rounded-2xl resize-none p-4"
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          <Button
            variant="outline"
            onClick={addExperience}
            className="w-full h-20 border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all rounded-[32px] gap-3 text-muted-foreground hover:text-primary group"
          >
            <div className="h-10 w-10 rounded-full bg-muted group-hover:bg-primary/20 flex items-center justify-center transition-colors">
              <Plus className="h-6 w-6" />
            </div>
            <span className="font-bold text-lg">Add Work Experience</span>
          </Button>

          {experiences.length === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-muted-foreground font-medium italic pt-4"
            >
              No experience added yet. Don't be shy!
            </motion.p>
          )}
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
            onClick={() => router.push("/onboarding-v2?step=4")}
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
            {isSaving ? "Saving..." : "Next"}
            <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>

      <div className="hidden lg:flex relative h-125 lg:h-175 w-[35%] items-center justify-center">
        <div className="absolute inset-0 bg-secondary/10 rounded-[40px] border border-border/50 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_70%)] opacity-[0.03]" />

          <div className="absolute inset-0 flex items-center justify-center p-8">
            <motion.div
              animate={{
                y: [0, -12, 0],
                rotateZ: [0, -0.5, 0],
              }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-full h-full max-h-125"
            >
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-[40px] -z-10" />
              <div className="relative w-full h-full rounded-[32px] overflow-hidden border-2 border-primary/20 shadow-2xl">
                <Image
                  src="/assets/img/ai/onboarding-experience.webp"
                  alt="Experience Workspace"
                  fill
                  className="object-cover grayscale-[0.3] hover:grayscale-0 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-linear-to-t from-background/80 via-transparent to-transparent" />

                <div className="absolute bottom-8 left-8 right-8 space-y-4">
                  <div className="flex gap-2">
                    <div className="h-1 w-12 bg-primary rounded-full" />
                    <div className="h-1 w-6 bg-primary/30 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-3/4 bg-white/20 backdrop-blur-md rounded-lg" />
                    <div className="h-3 w-1/2 bg-white/10 backdrop-blur-md rounded-lg" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="absolute bottom-10 left-10 pointer-events-none select-none">
            <span className="text-[10rem] font-display font-black leading-none opacity-[0.03] text-foreground block rotate-[-4deg]">
              JOURNEY
            </span>
          </div>
        </div>
      </div>
    </form>
  );
}
