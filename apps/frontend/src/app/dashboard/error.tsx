"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  AlertTriangle,
  LayoutDashboard,
  LifeBuoy,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    console.error(error);
  }, [error]);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const rotateX = useSpring(
    useTransform(y, [-0.5, 0.5], [8, -8]),
    springConfig
  );
  const rotateY = useSpring(
    useTransform(x, [-0.5, 0.5], [-8, 8]),
    springConfig
  );

  const mouseX = useSpring(useMotionValue(0), springConfig);
  const mouseY = useSpring(useMotionValue(0), springConfig);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((event.clientX - centerX) / rect.width);
    y.set((event.clientY - centerY) / rect.height);
    mouseX.set(event.clientX - rect.left);
    mouseY.set(event.clientY - rect.top);
  }

  return (
    <div
      className="flex h-[calc(100dvh-4rem)] items-center justify-center p-6 bg-background/50 backdrop-blur-sm overflow-hidden"
      style={{ perspective: "1000px" }}
    >
      {/* Red Pulse background for error */}
      <div className="absolute inset-0 bg-destructive/5 animate-pulse pointer-events-none" />

      <motion.div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          x.set(0);
          y.set(0);
          setIsHovered(false);
        }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="w-full max-w-xl"
      >
        <Card className="relative border-destructive/20 bg-card/40 shadow-xl backdrop-blur-md overflow-hidden">
          {/* Error Spotlight */}
          <motion.div
            className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300"
            style={{
              opacity: isHovered ? 1 : 0,
              background: useTransform(
                [mouseX, mouseY],
                ([mx, my]) =>
                  `radial-gradient(400px circle at ${mx}px ${my}px, rgba(var(--destructive-rgb), 0.05), transparent 40%)`
              ),
            }}
          />

          <CardContent className="flex flex-col items-center text-center p-12 space-y-8">
            <motion.div style={{ translateZ: "40px" }} className="relative">
              <div className="h-20 w-20 bg-destructive/10 border border-destructive/20 rounded-full flex items-center justify-center relative z-10">
                <AlertTriangle className="h-10 w-10 text-destructive" />
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-10px] border border-dashed border-destructive/20 rounded-full"
              />
            </motion.div>

            <div className="space-y-4">
              <motion.div style={{ translateZ: "30px" }}>
                <Badge
                  variant="destructive"
                  className="px-3 py-1 font-mono tracking-tighter bg-destructive/10 text-destructive border-destructive/20"
                >
                  SYSTEM_EXCEPTION : {error.digest || "INTERNAL_FAILURE"}
                </Badge>
              </motion.div>

              <motion.h1
                style={{ translateZ: "60px" }}
                className="text-3xl font-bold tracking-tight text-foreground"
              >
                Colisión de Procesos
              </motion.h1>

              <motion.p
                style={{ translateZ: "20px" }}
                className="text-sm text-muted-foreground max-w-[320px] leading-relaxed"
              >
                Ocurrió un error inesperado al renderizar este componente del
                dashboard. Los datos locales han sido protegidos.
              </motion.p>
            </div>

            <motion.div
              style={{ translateZ: "50px" }}
              className="flex flex-col gap-3 w-full"
            >
              <div className="flex gap-3">
                <Button
                  onClick={() => reset()}
                  className="flex-1 shadow-md bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reiniciar Proceso
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Panel Control
                  </Link>
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <LifeBuoy className="mr-2 h-3 w-3" />
                Contactar Soporte Técnico
              </Button>
            </motion.div>
          </CardContent>

          <div className="absolute top-0 left-0 h-1 w-full bg-linear-to-r from-transparent via-destructive/30 to-transparent" />
        </Card>
      </motion.div>

      <style jsx global>{`
        :root {
          --destructive-rgb: 239, 68, 68;
        }
      `}</style>
    </div>
  );
}
