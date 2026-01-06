"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import Logo from "@/components/logo";
import { cn } from "@/lib/utils";

const MESSAGES = [
  {
    title: "Initiating Launch Sequence...",
    subtitle: "Preparing the engines for your career takeoff.",
  },
  {
    title: "Scanning for Awesomeness...",
    subtitle: "Analyzing your resume for hidden superpowers.",
  },
  {
    title: "Parsing Career Matrix...",
    subtitle: "Translating your experience into pure data gold.",
  },
  {
    title: "Aligning Chakras with ATS...",
    subtitle: "Optimizing your vibe for the hiring algorithms.",
  },
  {
    title: "Extracting Skills...",
    subtitle: "Identifying every tool in your professional toolkit.",
  },
  {
    title: "Calibrating Experience Points...",
    subtitle: "Calculating your level in the game of work.",
  },
  {
    title: "Finalizing Profile Construction...",
    subtitle: "Almost there! Just polishing the shiny bits.",
  },
];

interface UploadingCVProps {
  className?: string;
  isProcessing?: boolean; // Can be used to pause/stop animation if needed, but defaults to true visually
}

export default function UploadingCV({
  className,
  isProcessing = true,
}: UploadingCVProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isProcessing) return;

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2500); // Change message every 2.5 seconds

    return () => clearInterval(interval);
  }, [isProcessing]);

  const currentMessage = MESSAGES[messageIndex];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 min-h-100 w-full",
        className,
      )}
    >
      <div className="relative w-60 h-60 flex items-center justify-center mb-8">
        {/* Animated Orbit SVG */}
        <svg
          className="pl absolute inset-0 w-full h-full"
          viewBox="0 0 240 240"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="pl__ring pl__ring--a"
            cx="120"
            cy="120"
            r="105"
            fill="none"
            stroke="currentColor"
            strokeWidth="20"
            strokeDasharray="0 660"
            strokeDashoffset="-330"
            strokeLinecap="round"
          />
          <circle
            className="pl__ring pl__ring--b"
            cx="120"
            cy="120"
            r="35"
            fill="none"
            stroke="currentColor"
            strokeWidth="20"
            strokeDasharray="0 220"
            strokeDashoffset="-110"
            strokeLinecap="round"
          />
          <circle
            className="pl__ring pl__ring--c"
            cx="85"
            cy="120"
            r="70"
            fill="none"
            stroke="currentColor"
            strokeWidth="20"
            strokeDasharray="0 440"
            strokeLinecap="round"
          />
          <circle
            className="pl__ring pl__ring--d"
            cx="155"
            cy="120"
            r="70"
            fill="none"
            stroke="currentColor"
            strokeWidth="20"
            strokeDasharray="0 440"
            strokeLinecap="round"
          />
        </svg>

        {/* Centered Logo */}
        <div className="z-10 relative bg-background/50 backdrop-blur-sm rounded-full p-4 shadow-2xl border border-primary/10">
          {/* Using md size (32px) but the container makes it look prominent in the center */}
          <Logo variant="icon" size="xl" />
        </div>
      </div>

      <div className="text-center space-y-4 max-w-md relative h-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={messageIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute inset-x-0 top-0"
          >
            <h3 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-primary to-accent">
              {currentMessage.title}
            </h3>
            <p className="text-muted-foreground font-medium mt-2 text-lg">
              {currentMessage.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
