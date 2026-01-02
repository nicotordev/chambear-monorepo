"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useOnboarding } from "@/contexts/onboarding-context";
import { cn } from "@/lib/utils";
import { CreateProfileInput } from "@/schemas/user";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Navigation,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";

export function LocationStep() {
  const router = useRouter();
  const { register, setValue, watch } = useFormContext<CreateProfileInput>();
  const { onSubmit, isPending: isSaving } = useOnboarding();

  const address = watch("location") || "";
  const name = watch("name") || "";
  const [isLocating, setIsLocating] = useState(false);
  const [isValidated, setIsValidated] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 150 };
  const rotateX = useSpring(
    useTransform(mouseY, [-300, 300], [5, -5]),
    springConfig
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-300, 300], [-5, 5]),
    springConfig
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const fetchAddress = useCallback(async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `/api/v1/location/reverse?lat=${lat}&lon=${lon}`
      );

      if (!response.ok) throw new Error("Failed to fetch address");

      const data = await response.json();
      const displayName = data.display_name;

      setValue(
        "location",
        displayName || `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        { shouldDirty: true }
      );
      setIsValidated(true);
      toast.success("Location detected successfully");
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      setValue("location", `${lat.toFixed(4)}, ${lon.toFixed(4)}`, {
        shouldDirty: true,
      });
      setIsValidated(true);
      toast.warning("Detected coordinates, but couldn't resolve address");
    } finally {
      setIsLocating(false);
    }
  }, []);

  const handleLocateByIP = useCallback(async () => {
    try {
      const response = await fetch("http://ip-api.com/json/");
      if (!response.ok) throw new Error("IP location failed");
      const data = await response.json();
      if (data.status === "success") {
        await fetchAddress(data.lat, data.lon);
      } else {
        throw new Error(data.message || "IP location failed");
      }
    } catch (error) {
      console.error("IP Location error:", error);
      setIsLocating(false);
      toast.error(
        "Could not determine location by GPS or IP. Please enter it manually."
      );
    }
  }, [fetchAddress]);

  const handleLocate = useCallback(() => {
    setIsLocating(true);
    setIsValidated(false);

    if (!navigator.geolocation) {
      handleLocateByIP();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchAddress(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.warn("Geolocation failed, falling back to IP:", error.message);
        handleLocateByIP();
      },
      {
        enableHighAccuracy: false,
        timeout: 5000, // Faster fallback
        maximumAge: 300000,
      }
    );
  }, [fetchAddress, handleLocateByIP]);

  return (
    <>
      <div className="space-y-10 w-[60%] flex flex-col">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-4"
        >
          <h1 className="text-5xl md:text-7xl font-display leading-[1.1] text-foreground tracking-tight">
            Fill in with your <span className="text-accent italic">info</span>.
          </h1>
          <p className="text-muted-foreground text-xl font-medium leading-relaxed max-w-md">
            Let's start with the basics. Who are we helping today?
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <Card className="p-8 border-border/50 shadow-sm bg-card/40 backdrop-blur-xl border-2 rounded-3xl overflow-hidden relative">
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
          <p className="text-muted-foreground text-xl font-medium leading-relaxed max-w-md">
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
          <Card className="p-8 border-border/50 shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-none bg-card/40 backdrop-blur-xl border-2 rounded-3xl overflow-hidden relative">
            <div className="space-y-6">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Enter your street address, city, or zip..."
                  className="pl-12 h-14 bg-background/50 border-2 border-transparent focus-visible:border-primary focus-visible:ring-0 text-lg rounded-2xl transition-all"
                  value={address}
                  onChange={(e) => {
                    setValue("location", e.target.value);
                    setIsValidated(false);
                  }}
                />
              </div>

              <div className="flex gap-4">
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
                  <span className="font-semibold text-xs uppercase tracking-widest">
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
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/")}
            className="h-16 px-8 text-lg rounded-full hover:bg-muted transition-all active:scale-95 text-muted-foreground"
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
          <Button
            onClick={async () => {
              await onSubmit();
              router.push("/onboarding-v2?step=2");
            }}
            disabled={
              !address ||
              !name ||
              name.trim().split(/\s+/).length < 2 ||
              isLocating ||
              isSaving
            }
            className="h-16 px-10 text-lg bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 group"
          >
            {isSaving ? "Saving..." : "Confirm details"}
            <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>

          {isValidated && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-primary bg-primary/5 px-4 py-2 rounded-full border border-primary/10"
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
        className="relative h-125 lg:h-175 w-[35%] perspective-1000"
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

          {/* Decorative Side UI */}
          <div className="absolute top-8 right-8 flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                whileHover={{ x: -5 }}
                className="w-14 h-14 bg-background/60 backdrop-blur-md rounded-2xl border border-border/50 flex items-center justify-center shadow-lg cursor-pointer group hover:bg-background transition-colors"
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full transition-all group-hover:scale-150",
                    i === 1
                      ? "bg-primary"
                      : i === 2
                      ? "bg-accent"
                      : "bg-muted-foreground"
                  )}
                />
              </motion.div>
            ))}
          </div>

          {/* Background Text Element */}
          <div className="absolute bottom-10 left-10 pointer-events-none select-none">
            <span className="text-[10rem] font-display font-black leading-none opacity-[0.03] text-foreground block rotate-[-4deg]">
              Location
            </span>
          </div>
        </div>
      </motion.div>
    </>
  );
}
