"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { LayoutDashboard, MoveLeft, Search, Terminal } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardNotFound() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const rotateX = useSpring(
    useTransform(y, [-0.5, 0.5], [10, -10]),
    springConfig,
  );
  const rotateY = useSpring(
    useTransform(x, [-0.5, 0.5], [-10, 10]),
    springConfig,
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
      {/* Background Grid Pattern */}
      <div className="absolute inset-x-0 top-0 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_50%_50%_at_50%_50%,#000_20%,transparent_100%)] opacity-20 pointer-events-none" />

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
        <Card className="relative border-border/40 bg-card/40 shadow-xl backdrop-blur-md overflow-hidden">
          {/* Dashboard Spotlight */}
          <motion.div
            className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300"
            style={{
              opacity: isHovered ? 1 : 0,
              background: useTransform(
                [mouseX, mouseY],
                ([mx, my]) =>
                  `radial-gradient(400px circle at ${mx}px ${my}px, rgba(var(--primary-rgb), 0.05), transparent 40%)`,
              ),
            }}
          />

          <CardContent className="flex flex-col items-center text-center p-12 space-y-8">
            <motion.div
              style={{ translateZ: "40px" }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-700" />
              <div className="relative h-24 w-24 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-center">
                <Search className="h-10 w-10 text-primary animate-pulse" />
                <Terminal className="absolute -bottom-2 -right-2 h-6 w-6 text-muted-foreground/50" />
              </div>
            </motion.div>

            <div className="space-y-4">
              <motion.div style={{ translateZ: "30px" }}>
                <Badge
                  variant="outline"
                  className="px-3 py-1 font-mono tracking-tighter text-muted-foreground border-border/60"
                >
                  HTTP ERROR 404 : SECTOR_NOT_FOUND
                </Badge>
              </motion.div>

              <motion.h1
                style={{ translateZ: "60px" }}
                className="text-3xl font-bold tracking-tight bg-linear-to-b from-foreground to-muted-foreground bg-clip-text text-transparent"
              >
                Función no definida
              </motion.h1>

              <motion.p
                style={{ translateZ: "20px" }}
                className="text-sm text-muted-foreground max-w-70 leading-relaxed"
              >
                Has intentado acceder a un endpoint o vista que no existe en
                este sector del dashboard.
              </motion.p>
            </div>

            <motion.div
              style={{ translateZ: "50px" }}
              className="flex gap-4 w-full"
            >
              <Button asChild className="flex-1 shadow-md">
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.history.back()}
              >
                <MoveLeft className="mr-2 h-4 w-4" />
                Regresar
              </Button>
            </motion.div>
          </CardContent>

          <div className="absolute top-0 left-0 h-1 w-full bg-linear-to-r from-transparent via-primary/30 to-transparent" />
        </Card>
      </motion.div>
    </div>
  );
}
