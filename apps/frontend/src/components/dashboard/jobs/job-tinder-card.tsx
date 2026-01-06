"use client";

import {
  AnimatePresence,
  motion,
  type PanInfo,
  useMotionValue,
  useTransform,
} from "framer-motion";
import {
  Briefcase,
  Building2,
  X as CloseIcon,
  Heart,
  Info,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatEmploymentType, getFlagEmoji } from "@/lib/utils";
import type { Job } from "@/types";

interface JobTinderCardProps {
  job: Job;
  onSwipe: (direction: "left" | "right") => void;
  isTop: boolean;
  stackIndex?: number;
}

const EXIT_MS = 280;

const JobTinderCard = memo(function JobTinderCard({
  job,
  onSwipe,
  isTop,
  stackIndex = 0,
}: JobTinderCardProps) {
  const [showInfo, setShowInfo] = useState(false);
  const [isExiting, setIsExiting] = useState<null | "left" | "right">(null);

  const mvX = useMotionValue(0);

  // Derived transforms
  const rotate = useTransform(mvX, [-220, 220], [-15, 15]);
  const likeOpacity = useTransform(mvX, [60, 140], [0, 1]);
  const rejectOpacity = useTransform(mvX, [-140, -60], [1, 0]);

  const flag = useMemo(() => getFlagEmoji(job.location), [job.location]);

  const fit = useMemo(() => {
    const raw =
      typeof job.fit === "number" && Number.isFinite(job.fit) ? job.fit : 0;
    return Math.max(0, Math.min(100, Math.round(raw)));
  }, [job.fit]);

  const hasLogo = Boolean(job.company?.logo);

  const swipeTimeoutRef = useRef<number | null>(null);

  const clearSwipeTimeout = () => {
    if (swipeTimeoutRef.current !== null) {
      window.clearTimeout(swipeTimeoutRef.current);
      swipeTimeoutRef.current = null;
    }
  };

  const triggerSwipe = useCallback(
    (direction: "left" | "right") => {
      if (!isTop || isExiting) return;

      clearSwipeTimeout();
      setIsExiting(direction);

      // Kick motion value so the card visibly moves even if parent keeps it mounted briefly.
      mvX.set(direction === "right" ? 30 : -30);

      swipeTimeoutRef.current = window.setTimeout(() => {
        onSwipe(direction);
      }, EXIT_MS);
    },
    [isTop, isExiting, mvX, onSwipe],
  );

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!isTop || isExiting) return;

      if (info.offset.x > 110) {
        triggerSwipe("right");
        return;
      }

      if (info.offset.x < -110) {
        triggerSwipe("left");
        return;
      }

      // Snap back
      mvX.set(0);
    },
    [isTop, isExiting, mvX, triggerSwipe],
  );

  const exitX = isExiting === "right" ? 1200 : isExiting === "left" ? -1200 : 0;

  return (
    <motion.div
      style={{
        x: mvX,
        rotate,
        zIndex: isTop ? 50 : 10 - stackIndex,
      }}
      drag={isTop && !isExiting ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.06}
      onDragEnd={handleDragEnd}
      animate={{
        scale: 1 - stackIndex * 0.04,
        y: stackIndex * 14,
        opacity: stackIndex > 2 ? 0 : 1,
      }}
      exit={{
        x: exitX,
        opacity: 0,
        scale: 0.88,
        rotate: exitX > 0 ? 24 : -24,
        transition: { duration: EXIT_MS / 1000, ease: "easeOut" },
      }}
      whileTap={isTop && !isExiting ? { scale: 0.985 } : {}}
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <Card className="w-full max-w-105 h-155 overflow-hidden relative border border-border/50 shadow-xl bg-card py-0 pointer-events-auto select-none">
        {/* Visual Swiping Decals */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-12 left-10 z-50 border-4 border-green-500 text-green-500 font-black text-4xl px-4 py-2 rounded-lg rotate-[-15deg] pointer-events-none uppercase tracking-tighter"
        >
          LIKE
        </motion.div>
        <motion.div
          style={{ opacity: rejectOpacity }}
          className="absolute top-12 right-10 z-50 border-4 border-red-500 text-red-500 font-black text-4xl px-4 py-2 rounded-lg rotate-15 pointer-events-none uppercase tracking-tighter"
        >
          NOPE
        </motion.div>

        {/* Card Content Wrapper */}
        <div className="h-full flex flex-col relative">
          {/* Top Header */}
          <div className="bg-linear-to-b from-primary/10 to-transparent h-48 relative flex flex-col items-center justify-center p-6 text-center">
            {hasLogo && job.company?.logo ? (
              <div className="relative group p-4">
                <Image
                  src={job.company.logo}
                  alt={job.companyName}
                  width={100}
                  height={100}
                  className="w-24 h-24 object-contain rounded-2xl bg-white shadow-md z-10 transition-transform group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-muted flex items-center justify-center z-10 shadow-inner">
                <Building2 className="w-12 h-12 text-muted-foreground/30" />
              </div>
            )}

            <h2 className="text-xl font-bold mt-4 leading-snug line-clamp-2 px-2 max-w-[90%]">
              {job.title}
            </h2>
            <p className="text-muted-foreground font-medium text-sm">
              {job.companyName}
            </p>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm bg-muted/30 p-2.5 rounded-xl border border-border/40">
                <span className="text-lg">{flag}</span>
                <span className="truncate font-medium">
                  {job.location || "Remote"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm bg-muted/30 p-2.5 rounded-xl border border-border/40">
                <Briefcase className="w-4 h-4 text-primary" />
                <span className="font-medium">
                  {formatEmploymentType(job.employmentType)}
                </span>
              </div>
            </div>

            {/* Fit Score */}
            <div className="bg-primary/3 p-4 rounded-2xl border border-primary/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-sm font-bold text-primary/80 uppercase tracking-wider">
                    AI Fit Score
                  </span>
                </div>
                <span className="text-xl font-black text-primary">{fit}%</span>
              </div>
              <Progress value={fit} className="h-1.5 bg-primary/10" />
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {(job.tags ?? []).slice(0, 5).map((tag, i) => (
                <Badge
                  key={`${tag}-${i}`}
                  variant="outline"
                  className="bg-muted/10 border-border/60 font-semibold text-[11px] py-0.5"
                >
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <p className="text-sm leading-relaxed text-muted-foreground/90 line-clamp-4 italic">
                “{job.description}”
              </p>
            </div>
          </div>

          {/* Safety space for fixed buttons */}
          <div className="h-28" />
        </div>

        {/* Floating Actions Overlay */}
        <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-6 px-6 pointer-events-none">
          <Button
            size="icon"
            variant="outline"
            className="w-14 h-14 rounded-full border-2 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-xl bg-card pointer-events-auto disabled:opacity-50"
            onClick={() => triggerSwipe("left")}
            disabled={!isTop || Boolean(isExiting)}
          >
            <CloseIcon className="w-7 h-7" />
          </Button>

          <Button
            size="icon"
            variant="outline"
            className="w-12 h-12 rounded-full border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200 bg-card pointer-events-auto disabled:opacity-50"
            onClick={() => setShowInfo(true)}
            disabled={!isTop || Boolean(isExiting)}
          >
            <Info className="w-5 h-5" />
          </Button>

          <Button
            size="icon"
            className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white transition-all duration-300 shadow-xl scale-110 pointer-events-auto disabled:opacity-50"
            onClick={() => triggerSwipe("right")}
            disabled={!isTop || Boolean(isExiting)}
          >
            <Heart className="w-7 h-7 fill-current" />
          </Button>
        </div>

        {/* Expanded Info Overlay */}
        <AnimatePresence>
          {showInfo ? (
            <motion.div
              key="job-info"
              initial={{ opacity: 0, y: "10%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "10%" }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute inset-0 bg-background z-100 p-8 overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black tracking-tight">
                    {job.title}
                  </h3>
                  <p className="text-primary font-bold">{job.companyName}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => setShowInfo(false)}
                >
                  <CloseIcon className="w-6 h-6" />
                </Button>
              </div>

              <div className="space-y-8 pb-12">
                <div className="space-y-3">
                  <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">
                    About the role
                  </h4>
                  <div className="text-base text-balance leading-relaxed whitespace-pre-wrap">
                    {job.description}
                  </div>
                </div>

                {job.externalUrl ? (
                  <Button
                    asChild
                    size="lg"
                    className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/20"
                  >
                    <a
                      href={job.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Apply Now
                    </a>
                  </Button>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
});

JobTinderCard.displayName = "JobTinderCard";

export default JobTinderCard;
