import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileUp,
  Loader2,
  MapPin,
  Navigation,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useOnboarding } from "@/contexts/onboarding-context";
import { useProfile } from "@/contexts/user-context";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import type { CreateProfileInput } from "@/schemas/user";
import { useMotionValue, useSpring, useTransform } from "framer-motion";
import { motion } from "framer-motion";

export function LocationStep() {
  const router = useRouter();
  const { register, setValue, watch, getValues } =
    useFormContext<CreateProfileInput>();
  const { onSubmit, isPending: isSaving } = useOnboarding();
  const { currentProfile } = useProfile();
  const profileId = currentProfile?.id;

  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isValidated, setIsValidated] = useState(false);

  const address = watch("location");
  const name = watch("name");

  // Motion stuff
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [0, 400], [10, -10]), {
    stiffness: 100,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(x, [0, 600], [-10, 10]), {
    stiffness: 100,
    damping: 30,
  });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      x.set(e.clientX - rect.left);
      y.set(e.clientY - rect.top);
    },
    [x, y]
  );

  const handleLocate = async () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setValue("location", `${latitude}, ${longitude}`, {
            shouldDirty: true,
            shouldValidate: true,
          });
          setIsValidated(true);
          setIsLocating(false);
          toast.success("Location detected!");
        },
        (error) => {
          console.error(error);
          setIsLocating(false);
          toast.error("Could not detect location.");
        }
      );
    } else {
      setIsLocating(false);
      toast.error("Geolocation is not supported by your browser.");
    }
  };

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profileId) return;

    try {
      setIsUploadingCv(true);
      const loadingToast = toast.loading("Processing your CV...");

      // 1. Upload file
      const doc = await api.uploadFile(file, profileId);

      // 2. Parse resume
      const parsedData = await api.parseResume(profileId, {
        documentId: doc.id,
      });

      // 3. Populate form
      if (parsedData) {
        if (parsedData.name)
          setValue("name", parsedData.name, {
            shouldDirty: true,
            shouldValidate: true,
          });
        if (parsedData.headline)
          setValue("headline", parsedData.headline, {
            shouldDirty: true,
            shouldValidate: true,
          });
        if (parsedData.summary)
          setValue("summary", parsedData.summary, {
            shouldDirty: true,
            shouldValidate: true,
          });
        if (parsedData.location)
          setValue("location", parsedData.location, {
            shouldDirty: true,
            shouldValidate: true,
          });
        if (parsedData.yearsExperience !== undefined)
          setValue("yearsExperience", parsedData.yearsExperience, {
            shouldDirty: true,
            shouldValidate: true,
          });
        if (parsedData.targetRoles)
          setValue("targetRoles", parsedData.targetRoles, {
            shouldDirty: true,
            shouldValidate: true,
          });
        if (parsedData.skills)
          setValue("skills", parsedData.skills, {
            shouldDirty: true,
            shouldValidate: true,
          });

        if (parsedData.experiences) {
          setValue(
            "experiences",
            parsedData.experiences.map((exp) => ({
              ...exp,
              startDate: new Date(exp.startDate),
              endDate: exp.endDate ? new Date(exp.endDate) : null,
              highlights: [], // ParsedProfile experiences don't have highlights currently
            })),
            { shouldDirty: true, shouldValidate: true }
          );
        }

        if (parsedData.educations) {
          setValue(
            "educations",
            parsedData.educations.map((edu) => ({
              ...edu,
              startDate: edu.startDate ? new Date(edu.startDate) : undefined,
              endDate: edu.endDate ? new Date(edu.endDate) : null,
            })),
            { shouldDirty: true, shouldValidate: true }
          );
        }

        if (parsedData.certifications) {
          setValue(
            "certifications",
            parsedData.certifications.map((cert) => ({
              ...cert,
              issueDate: new Date(cert.issueDate),
              credentialUrl: cert.credentialUrl || "",
            })),
            { shouldDirty: true, shouldValidate: true }
          );
        }

        toast.success("Profile populated from CV!", { id: loadingToast });
      } else {
        toast.error("Could not parse CV. Please try manual entry.", {
          id: loadingToast,
        });
      }
    } catch (error) {
      console.error("CV Upload error:", error);
      toast.error("Failed to process CV. Please try manual entry.");
    } finally {
      setIsUploadingCv(false);
    }
  };

  if (isUploadingCv) {
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const data = getValues();
        await onSubmit(data, 2);
      }}
      className="contents"
    >
      <div className="space-y-10 w-full lg:w-[60%] flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="relative group mb-4"
        >
          <div className="absolute -inset-1 bg-linear-to-r from-primary to-accent rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
          <Card className="relative p-6 border-border/50 bg-card/60 backdrop-blur-xl border-2 rounded-3xl flex flex-col md:flex-row items-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              {isUploadingCv ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <FileUp className="h-8 w-8" />
              )}
            </div>
            <div className="flex-1 text-center md:text-left space-y-1">
              <h3 className="text-xl font-bold tracking-tight">
                Express Onboarding
              </h3>
              <p className="text-muted-foreground font-medium">
                Upload your CV and let JobPilot build your profile instantly.
              </p>
            </div>
            <div className="shrink-0 w-full md:w-auto">
              <input
                type="file"
                id="cv-upload"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleCvUpload}
                disabled={isUploadingCv}
              />
              <Button
                type="button"
                variant="default"
                className="w-full md:w-auto h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-bold hover:scale-105 transition-transform"
                onClick={() => document.getElementById("cv-upload")?.click()}
                disabled={isUploadingCv}
              >
                {isUploadingCv ? "Processing..." : "Upload CV"}
              </Button>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-4"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display leading-[1.1] text-foreground tracking-tight">
            Fill in with your <span className="text-accent italic">info</span>.
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium leading-relaxed max-w-md">
            Let's start with the basics. Who are we helping today?
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <Card className="p-6 md:p-8 border-border/50 shadow-sm bg-card/40 backdrop-blur-xl border-2 rounded-3xl overflow-hidden relative">
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Full Name
              </label>
              <Input
                placeholder="How should we call you?"
                {...register("name")}
                className="h-14 bg-background/50 border-2 border-transparent focus-visible:border-primary focus-visible:ring-0 text-lg rounded-2xl transition-all"
              />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="space-y-4"
        >
          <h2 className="text-3xl md:text-5xl font-display leading-[1.1] text-foreground tracking-tight">
            Geo-Strategic <span className="text-accent italic">Placement</span>
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl font-medium leading-relaxed max-w-md">
            Where should JobPilot focus its search? Define your target
            markets—whether remote, local, or global—to maximize opportunity
            density.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Card className="p-6 md:p-8 border-border/50 shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-none bg-card/40 backdrop-blur-xl border-2 rounded-3xl overflow-hidden relative">
            <div className="space-y-6">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Enter your street address, city, or zip..."
                  className="pl-12 h-14 bg-background/50 border-2 border-transparent focus-visible:border-primary focus-visible:ring-0 text-lg rounded-2xl transition-all"
                  value={address ?? ""}
                  onChange={(e) => {
                    setValue("location", e.target.value);
                    setIsValidated(false);
                  }}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 h-14 gap-3 border-2 transition-all bg-transparent rounded-2xl text-base group",
                    address === "Remote"
                      ? "border-accent bg-accent/5 text-accent"
                      : "border-border hover:border-accent"
                  )}
                  onClick={() => {
                    setValue("location", "Remote", {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    setIsValidated(true);
                  }}
                >
                  <Navigation className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-xs uppercase tracking-widest text-center">
                    Remote / Global Mission
                  </span>
                </Button>

                <Button
                  variant="outline"
                  className="flex-1 h-14 gap-3 border-2 border-border hover:border-primary hover:bg-primary/5 transition-all bg-transparent rounded-2xl text-base group"
                  onClick={handleLocate}
                  disabled={isLocating}
                >
                  {isLocating ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      }}
                      className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent"
                    />
                  ) : (
                    <MapPin className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                  )}
                  <span className="font-semibold text-xs uppercase tracking-widest">
                    {isLocating ? "Detecting..." : "Detect Location"}
                  </span>
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
        >
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/")}
            className="w-full sm:w-auto h-16 px-8 text-lg rounded-full hover:bg-muted transition-all active:scale-95 text-muted-foreground order-2 sm:order-1"
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
          <Button
            type="submit"
            disabled={
              !address || !name || name.length < 2 || isLocating || isSaving
            }
            className="w-full sm:w-auto h-16 px-10 text-lg bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 group order-1 sm:order-2"
          >
            {isSaving ? "Saving..." : "Confirm details"}
            <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>

          {isValidated && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-2 text-primary bg-primary/5 px-4 py-2 rounded-full border border-primary/10 order-3"
            >
              <Check className="h-5 w-5" />
              <span className="font-bold text-sm uppercase tracking-wider">
                Address validated
              </span>
            </motion.div>
          )}
        </motion.div>
      </div>

      <motion.div
        className="hidden lg:flex relative h-125 lg:h-175 w-[35%] perspective-1000"
        onMouseMove={handleMouseMove}
        style={{ rotateX, rotateY }}
      >
        <div className="absolute inset-0 bg-secondary/20 rounded-[40px] overflow-hidden border border-border shadow-2xl backdrop-blur-sm">
          {/* Abstract Grid Map */}
          <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(var(--foreground)_1.5px,transparent_1.5px)] bg-size-[40px_40px]" />

          {/* Visual depth elements */}
          <div className="absolute top-10 left-10 w-40 h-1 bg-primary/20 blur-sm rounded-full rotate-45" />
          <div className="absolute bottom-20 right-20 w-60 h-1 bg-accent/20 blur-sm rounded-full -rotate-12" />

          <motion.div
            initial={false}
            animate={
              address === "Remote"
                ? {
                    top: "50%",
                    left: "50%",
                    scale: [1, 1.2, 1],
                    opacity: 1,
                  }
                : address
                ? {
                    top: "50%",
                    left: "50%",
                    scale: 1,
                    opacity: 1,
                  }
                : {
                    top: "70%",
                    left: "30%",
                    scale: 0,
                    opacity: 0,
                  }
            }
            transition={
              address === "Remote"
                ? {
                    scale: {
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                    default: { type: "spring", damping: 15, stiffness: 100 },
                  }
                : { type: "spring", damping: 15, stiffness: 100 }
            }
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center"
          >
            <div className="relative group">
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                className="absolute inset-0 bg-accent rounded-full blur-xl"
              />
              <div className="relative bg-accent text-accent-foreground p-5 rounded-3xl shadow-[0_15px_40px_rgba(var(--accent),0.4)] transition-transform group-hover:scale-110">
                <MapPin className="h-10 w-10 fill-current" />
              </div>
            </div>

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mt-6 bg-card/90 backdrop-blur-xl px-6 py-3 rounded-2xl border-2 border-accent/20 shadow-2xl"
            >
              <p className="text-sm font-bold tracking-tight text-foreground line-clamp-1 max-w-50">
                {address || "Searching..."}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </form>
  );
}
