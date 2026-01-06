"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOnboarding } from "@/contexts/onboarding-context";
import type { CreateProfileInput } from "@/schemas/user";
import { SkillLevel } from "@/types";

const SUGGESTED_TECHNICAL: Record<string, string[]> = {
  tech: [
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Python",
    "Vector Databases",
    "Cloud Architecture",
  ],
  design: [
    "Figma",
    "Adobe Creative Cloud",
    "UI/UX Design",
    "Motion Graphics",
    "Design Systems",
    "Photography",
  ],
  marketing: [
    "SEO/SEM",
    "Growth Hacking",
    "Content Strategy",
    "Google Analytics",
    "Social Media Ads",
    "Public Relations",
  ],
  sales: [
    "CRM Mastery",
    "Lead Generation",
    "Contract Negotiation",
    "B2B Sales",
    "Revenue Operations",
    "Strategic Partnerships",
  ],
  legal: [
    "Contract Law",
    "Intellectual Property",
    "Compliance",
    "Corporate Governance",
    "Risk Management",
    "Legal Writing",
  ],
  finance: [
    "Financial Modeling",
    "Accounting Standards",
    "Investments",
    "Portfolio Management",
    "Taxation",
    "Equities",
  ],
  healthcare: [
    "Patient Care",
    "Medical Coding",
    "HIPAA Compliance",
    "Clinical Research",
    "Diagnostic Support",
    "Healthcare Admin",
  ],
  operations: [
    "Supply Chain",
    "Logistics",
    "Project Management",
    "Lean Six Sigma",
    "Inventory Control",
    "Vendor Management",
  ],
};

const SUGGESTED_SOFT = [
  "Strategic Thinking",
  "Team Leadership",
  "Communication",
  "Problem Solving",
  "Adaptability",
  "Collaboration",
  "Emotional Intelligence",
  "Critical Thinking",
  "Time Management",
];

export function SkillsStep() {
  const router = useRouter();
  const { setValue, control, getValues } = useFormContext<CreateProfileInput>();
  const { onSubmit, isPending: isSaving } = useOnboarding();

  const [roleInput, setRoleInput] = useState("");
  const targetRoles = useWatch({ control, name: "targetRoles" }) || [];

  const [techSkillInput, setTechSkillInput] = useState("");
  const [softSkillInput, setSoftSkillInput] = useState("");
  const skills = useWatch({ control, name: "skills" }) || [];

  const addRole = (role: string) => {
    const trimmed = role.trim();
    if (trimmed && !targetRoles.includes(trimmed)) {
      setValue("targetRoles", [...targetRoles, trimmed], { shouldDirty: true });
      setRoleInput("");
    }
  };

  const addSkill = (skillName: string, isSoft = false) => {
    const trimmed = skillName.trim();
    if (trimmed && !skills.some((s) => s.skillName === trimmed)) {
      setValue(
        "skills",
        [...skills, { skillName: trimmed, level: SkillLevel.INTERMEDIATE }],
        { shouldDirty: true, shouldValidate: true },
      );
      if (isSoft) {
        setSoftSkillInput("");
      } else {
        setTechSkillInput("");
      }
    }
  };

  const removeRole = (role: string) => {
    const currentRoles = getValues("targetRoles") || [];
    setValue(
      "targetRoles",
      currentRoles.filter((r) => r !== role),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const removeSkill = (skillName: string) => {
    const currentSkills = getValues("skills") || [];
    setValue(
      "skills",
      currentSkills.filter((s) => s.skillName !== skillName),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  return (
    <form
      onSubmit={async () => {
        const data = getValues();
        await onSubmit(data, 5);
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
            Map Your <span className="text-accent italic">Skill-Base DNA</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium leading-relaxed max-w-md">
            In a skill-first economy, your unique competency matrix is your
            strongest asset. Define your expertise to optimize your Agent's
            mission parameters.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-10"
        >
          {/* Roles SECTION */}
          <div className="space-y-4">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Target Roles
            </label>
            <div className="relative group">
              <Input
                placeholder="Type a role (e.g. Frontend Engineer) and press enter"
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    addRole(roleInput);
                  }
                }}
                className="h-14 bg-card/40 backdrop-blur-xl border-2 border-border/50 focus-visible:border-primary rounded-2xl text-lg pr-12"
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 text-primary hover:bg-primary/10 rounded-xl"
                onClick={() => addRole(roleInput)}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence mode="popLayout">
                {targetRoles.map((role) => (
                  <motion.div
                    key={role}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    layout
                  >
                    <Badge
                      variant="secondary"
                      className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 bg-primary/5 border-primary/10 text-primary group hover:bg-destructive/10 hover:text-destructive hover:border-destructive/10 transition-colors"
                    >
                      {role}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeRole(role);
                        }}
                        className="hover:text-destructive transition-colors p-1 -mr-2 rounded-full hover:bg-destructive/10"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  </motion.div>
                ))}
                {roleInput && !targetRoles.includes(roleInput.trim()) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.5, scale: 1 }}
                    className="cursor-pointer"
                    onClick={() => addRole(roleInput)}
                  >
                    <Badge
                      variant="outline"
                      className="px-4 py-2 rounded-xl border-dashed border-primary/30"
                    >
                      Add "{roleInput.trim()}"...
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Skills SECTION */}
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" /> Technical Skills
              </label>
              <div className="relative group">
                <Input
                  placeholder="What's in your stack?"
                  value={techSkillInput}
                  onChange={(e) => setTechSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.stopPropagation();
                      addSkill(techSkillInput);
                    }
                  }}
                  className="h-14 bg-card/40 backdrop-blur-xl border-2 border-border/50 focus-visible:border-accent rounded-2xl text-lg pr-12"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 text-accent hover:bg-accent/10 rounded-xl"
                  onClick={() => addSkill(techSkillInput)}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(() => {
                const userField =
                  getValues("targetRoles")?.[0]?.toLowerCase() || "tech";
                const fieldKey =
                  Object.keys(SUGGESTED_TECHNICAL).find((k) =>
                    userField.includes(k),
                  ) || "tech";

                return SUGGESTED_TECHNICAL[
                  fieldKey as keyof typeof SUGGESTED_TECHNICAL
                ]
                  .filter((s) => !skills.some((sk) => sk.skillName === s))
                  .map((skill) => (
                    <Button
                      key={skill}
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-dashed border-2 hover:border-accent hover:bg-accent/90 transition-all text-xs font-bold"
                      onClick={() => addSkill(skill)}
                    >
                      <Plus className="h-3 w-3 mr-1" /> {skill}
                    </Button>
                  ));
              })()}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <AnimatePresence mode="popLayout">
                {skills
                  .filter(
                    (s) =>
                      Object.values(SUGGESTED_TECHNICAL).some((techList) =>
                        techList.includes(s.skillName),
                      ) || !SUGGESTED_SOFT.includes(s.skillName),
                  )
                  .map((skill) => (
                    <motion.div
                      key={skill.skillName}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      layout
                    >
                      <Badge
                        variant="secondary"
                        className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 bg-accent/5 border-accent/10 text-accent group hover:bg-destructive/10 hover:text-destructive hover:border-destructive/10 transition-colors shadow-sm"
                      >
                        {skill.skillName}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeSkill(skill.skillName);
                          }}
                          className="hover:text-destructive transition-colors p-1 -mr-2 rounded-full hover:bg-destructive/10"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    </motion.div>
                  ))}
                {techSkillInput &&
                  !skills.some(
                    (s) =>
                      s.skillName.toLowerCase() ===
                      techSkillInput.trim().toLowerCase(),
                  ) && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 0.5, scale: 1 }}
                      className="cursor-pointer"
                      onClick={() => addSkill(techSkillInput)}
                    >
                      <Badge
                        variant="outline"
                        className="px-4 py-2 rounded-xl border-dashed border-accent/30 text-accent font-bold"
                      >
                        Add "{techSkillInput.trim()}" (Technical)...
                      </Badge>
                    </motion.div>
                  )}
              </AnimatePresence>
            </div>
          </div>

          {/* Soft Skills SECTION */}
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" /> Soft Skills
              </label>
              <div className="relative group">
                <Input
                  placeholder="e.g. Leadership, Communication..."
                  value={softSkillInput}
                  onChange={(e) => setSoftSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.stopPropagation();
                      addSkill(softSkillInput, true);
                    }
                  }}
                  className="h-14 bg-card/40 backdrop-blur-xl border-2 border-border/50 focus-visible:border-primary rounded-2xl text-lg pr-12"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 text-primary hover:bg-primary/10 rounded-xl"
                  onClick={() => addSkill(softSkillInput, true)}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_SOFT.filter(
                  (s) => !skills.some((sk) => sk.skillName === s),
                ).map((skill) => (
                  <Button
                    key={skill}
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-dashed border-2 hover:border-primary hover:bg-primary/90 transition-all text-xs font-bold"
                    onClick={() => addSkill(skill)}
                  >
                    <Plus className="h-3 w-3 mr-1" /> {skill}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <AnimatePresence mode="popLayout">
                {skills
                  .filter((s) => SUGGESTED_SOFT.includes(s.skillName))
                  .map((skill) => (
                    <motion.div
                      key={skill.skillName}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      layout
                    >
                      <Badge
                        variant="secondary"
                        className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 bg-primary/5 border-primary/10 text-primary group hover:bg-destructive/10 hover:text-destructive hover:border-destructive/10 transition-colors shadow-sm"
                      >
                        {skill.skillName}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeSkill(skill.skillName);
                          }}
                          className="hover:text-destructive transition-colors p-1 -mr-2 rounded-full hover:bg-destructive/10"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    </motion.div>
                  ))}
                {softSkillInput &&
                  !skills.some(
                    (s) =>
                      s.skillName.toLowerCase() ===
                      softSkillInput.trim().toLowerCase(),
                  ) && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 0.5, scale: 1 }}
                      className="cursor-pointer"
                      onClick={() => addSkill(softSkillInput, true)}
                    >
                      <Badge
                        variant="outline"
                        className="px-4 py-2 rounded-xl border-dashed border-primary/30 text-primary font-bold"
                      >
                        Add "{softSkillInput.trim()}" (Soft)...
                      </Badge>
                    </motion.div>
                  )}
              </AnimatePresence>
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
            onClick={() => router.push("/onboarding-v2?step=3")}
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
            {isSaving ? "Finalizing Map..." : "Map Skill-Base"}
            <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>

      <div className="hidden lg:flex relative h-125 lg:h-175 w-[35%] items-center justify-center">
        <div className="absolute inset-0 bg-secondary/10 rounded-[40px] border border-border/50 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--accent)_0%,transparent_70%)] opacity-[0.03]" />

          <div className="absolute inset-0 flex items-center justify-center p-8">
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotateZ: [0, 0.5, 0],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-full h-full max-h-125"
            >
              <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-[40px] -z-10 animate-pulse" />
              <div className="relative w-full h-full rounded-[32px] overflow-hidden border-2 border-accent/20 shadow-2xl">
                <Image
                  src="/assets/img/ai/onboarding-skills.webp"
                  alt="Platform Logic"
                  fill
                  className="object-cover grayscale-[0.5] hover:grayscale-0 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent opacity-60" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </form>
  );
}
