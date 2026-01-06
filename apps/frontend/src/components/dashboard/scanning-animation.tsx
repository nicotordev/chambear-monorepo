"use client";

import { motion } from "framer-motion";
import { CheckCircle2, FileText, Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const STEPS = [
  { icon: Search, text: "Buscando ofertas relevantes..." },
  { icon: FileText, text: "Analizando descripciones..." },
  { icon: CheckCircle2, text: "Filtrando por tus preferencias..." },
  { icon: Loader2, text: "Finalizando recomendaciones..." },
];

export function ScanningAnimation() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % STEPS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = STEPS[stepIndex].icon;

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6 text-center animate-in fade-in zoom-in duration-300">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
        <div className="relative bg-background p-4 rounded-full border shadow-lg">
          <motion.div
            key={stepIndex}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CurrentIcon
              className={cn(
                "w-12 h-12 text-primary",
                stepIndex === 3 && "animate-spin",
              )}
            />
          </motion.div>
        </div>
      </div>

      <div className="space-y-2">
        <motion.h3
          key={stepIndex}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-xl font-semibold"
        >
          {STEPS[stepIndex].text}
        </motion.h3>
        <p className="text-muted-foreground text-sm">
          Esto puede tomar unos segundos...
        </p>
      </div>

      <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "linear",
          }}
        />
      </div>
    </div>
  );
}
