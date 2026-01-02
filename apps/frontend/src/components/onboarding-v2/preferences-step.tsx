import { Input } from "@/components/ui/input";
import { useOnboarding } from "@/contexts/onboarding-context";
import { cn } from "@/lib/utils";
import { CreateProfileInput } from "@/schemas/user";
import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  Target,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

const categories = [
  {
    id: "tech",
    label: "Technology",
    icon: Zap,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    id: "design",
    label: "Creative & Design",
    icon: Sparkles,
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: Target,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    id: "sales",
    label: "Sales & Growth",
    icon: Briefcase,
    color: "text-accent",
    bg: "bg-accent/10",
  },
];

export function PreferencesStep() {
  const router = useRouter();
  const { setValue, control, getValues } = useFormContext<CreateProfileInput>();
  const { onSubmit, isPending: isSaving } = useOnboarding();
  const [customRole, setCustomRole] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const selectedCategories =
    useWatch({
      control,
      name: "targetRoles",
    }) || [];

  const toggleCategory = (catId: string) => {
    const currentRoles = getValues("targetRoles") || [];
    const nextChoices = currentRoles.includes(catId)
      ? currentRoles.filter((id) => id !== catId)
      : [...currentRoles, catId];
    setValue("targetRoles", nextChoices, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const addCustomRole = () => {
    if (customRole.trim() && !selectedCategories.includes(customRole.trim())) {
      const nextChoices = [...selectedCategories, customRole.trim()];
      setValue("targetRoles", nextChoices, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setCustomRole("");
      setShowCustomInput(false);
    }
  };

  return (
    <>
      <div className="space-y-10 w-full lg:w-1/2 flex flex-col">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-4"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display leading-[1.1] text-foreground tracking-tight">
            Mission Parameters{" "}
            <span className="text-accent italic">& Alignment</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium leading-relaxed max-w-md">
            Configure your Agent's operational constraints. Define your ideal
            role—choose from standard vectors or define a custom mission.
          </p>
        </motion.div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {categories.map((cat) => (
              <Card
                onClick={() => toggleCategory(cat.id)}
                key={cat.id}
                className={cn(
                  "p-6 border-2 cursor-pointer transition-all bg-card/40 backdrop-blur-xl rounded-3xl group relative overflow-hidden",
                  selectedCategories.includes(cat.id)
                    ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(var(--primary),0.1)]"
                    : "border-border/50 hover:border-primary/30"
                )}
              >
                <div
                  className={`w-12 h-12 ${cat.bg} rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}
                >
                  <cat.icon className={`h-6 w-6 ${cat.color}`} />
                </div>
                <h3 className="font-bold text-lg mb-1">{cat.label}</h3>
                {selectedCategories.includes(cat.id) && (
                  <motion.div
                    layoutId="check"
                    className="absolute top-4 right-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4 text-primary-foreground rotate-45" />
                  </motion.div>
                )}
              </Card>
            ))}

            <Card
              onClick={() => setShowCustomInput(true)}
              className={cn(
                "p-6 border-2 border-dashed border-border/50 hover:border-primary/50 cursor-pointer transition-all bg-card/20 backdrop-blur-xl rounded-3xl group flex flex-col items-center justify-center text-center",
                showCustomInput && "border-primary/50"
              )}
            >
              <div className="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-1 text-muted-foreground group-hover:text-foreground">
                Custom Vector
              </h3>
            </Card>
          </motion.div>

          <AnimatePresence>
            {showCustomInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter custom role (e.g. Bio-Tech Engineer)"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCustomRole()}
                    className="h-14 rounded-2xl border-2 border-primary/20 focus-visible:ring-primary shadow-inner"
                    autoFocus
                  />
                  <Button
                    onClick={addCustomRole}
                    className="h-14 px-6 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                  >
                    Add
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowCustomInput(false)}
                    className="h-14 w-14 rounded-2xl hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap gap-2">
            {selectedCategories
              .filter((id) => !categories.find((c) => c.id === id))
              .map((role) => (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  key={role}
                  className="px-4 py-2 bg-accent/10 border border-accent/20 rounded-full flex items-center gap-2 group"
                >
                  <span className="text-sm font-semibold">{role}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleCategory(role);
                    }}
                    className="hover:text-destructive transition-colors p-1 -mr-2 rounded-full hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
        >
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/onboarding-v2?step=1")}
            className="w-full sm:w-auto h-16 px-8 text-lg rounded-full hover:bg-muted transition-all active:scale-95 text-muted-foreground order-2 sm:order-1"
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
          <Button
            onClick={async () => {
              await onSubmit();
              router.push("/onboarding-v2?step=3");
            }}
            disabled={isSaving}
            className="w-full sm:w-auto h-16 px-10 text-lg bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 group order-1 sm:order-2"
          >
            {isSaving ? "Initializing..." : "Proceed to Core Bio"}
            <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>

      <div className="hidden lg:flex relative h-125 lg:h-175 w-[35%] flex items-center justify-center">
        {/* Decorative AI Visualization */}
        <div className="absolute inset-0 bg-secondary/10 rounded-[40px] border border-border/50 overflow-hidden">
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] border border-primary/5 rounded-full"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
                className="absolute inset-0 bg-primary blur-3xl rounded-full"
              />
              <Card className="relative p-10 rounded-full bg-background/80 backdrop-blur-3xl border-2 border-primary/20 shadow-2xl">
                <Briefcase className="h-20 w-20 text-primary" />
              </Card>
            </div>
          </div>

          <div className="absolute bottom-10 left-10 pointer-events-none select-none">
            <span className="text-[10rem] font-display font-black leading-none opacity-[0.03] text-foreground block rotate-[-4deg]">
              WORK
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
