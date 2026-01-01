"use client";

import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Compass, Home, MoveLeft } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

export default function NotFoundRoot() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Motion values for mouse position
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth spring configuration
  const springConfig = { damping: 25, stiffness: 150 };
  const rotateX = useSpring(
    useTransform(y, [-0.5, 0.5], [15, -15]),
    springConfig
  );
  const rotateY = useSpring(
    useTransform(x, [-0.5, 0.5], [-15, 15]),
    springConfig
  );

  // Spotlight effect follows the mouse
  const mouseX = useSpring(useMotionValue(0), springConfig);
  const mouseY = useSpring(useMotionValue(0), springConfig);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    // Calculate normalized mouse position (-0.5 to 0.5)
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    x.set((event.clientX - centerX) / rect.width);
    y.set((event.clientY - centerY) / rect.height);

    // For spotlight effect (raw pixels)
    mouseX.set(event.clientX - rect.left);
    mouseY.set(event.clientY - rect.top);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  }

  return (
    <main>
      <Navbar />
      <div
        style={{ perspective: "1200px" }}
        className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 text-foreground selection:bg-primary/30"
      >
        {/* Ambient background animations */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.15, 0.25, 0.15],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-32 -top-32 h-128 w-lg rounded-full bg-primary/20 blur-[100px]"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.15, 0.25, 0.15],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-32 -bottom-32 h-144 w-xl rounded-full bg-accent/20 blur-[100px]"
          />
        </div>

        <motion.div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          initial={{ y: 20, opacity: 0 }}
          animate={{
            y: [0, -12, 0],
            opacity: 1,
          }}
          transition={{
            y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 0.8 },
          }}
          className="relative z-10 w-full max-w-2xl"
        >
          <Card className="relative overflow-hidden border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl transition-colors duration-500 hover:border-primary/30">
            {/* Spotlight highlight */}
            <motion.div
              className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300"
              style={{
                opacity: isHovered ? 1 : 0,
                background: useTransform(
                  [mouseX, mouseY],
                  ([mx, my]) =>
                    `radial-gradient(600px circle at ${mx}px ${my}px, rgba(var(--primary-rgb), 0.1), transparent 40%)`
                ),
              }}
            />

            <CardHeader className="relative space-y-4 text-center py-8">
              <motion.div
                style={{ translateZ: "40px" }}
                className="flex justify-center"
              >
                <Badge
                  variant="secondary"
                  className="px-3 py-1 text-xs font-medium tracking-wider uppercase"
                >
                  <Compass className="mr-2 h-3 w-3 animate-spin-slow" />
                  Error 404 · Ruta Extraviada
                </Badge>
              </motion.div>

              <motion.h1
                style={{ translateZ: "60px" }}
                className="text-balance font-heading text-5xl font-bold tracking-tight sm:text-6xl bg-linear-to-b from-foreground to-foreground/60 bg-clip-text text-transparent"
              >
                ¿Te has perdido?
              </motion.h1>

              <motion.p
                style={{ translateZ: "30px" }}
                className="mx-auto max-w-[80%] text-pretty text-sm text-muted-foreground sm:text-base leading-relaxed"
              >
                Parece que has cruzado una frontera hacia lo desconocido. La
                página que buscas no existe en esta realidad.
              </motion.p>
            </CardHeader>

            <CardContent className="relative space-y-8 pb-10">
              {/* Actions */}
              <motion.div
                style={{ translateZ: "50px" }}
                className="flex flex-wrap items-center justify-center gap-4"
              >
                <Button
                  size="lg"
                  asChild
                  className="group h-12 px-8 shadow-lg shadow-primary/20"
                >
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4 transition-transform group-hover:-translate-y-1" />
                    Volver al inicio
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 backdrop-blur-sm"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.history.back();
                    }
                  }}
                >
                  <MoveLeft className="mr-2 h-4 w-4" />
                  Página anterior
                </Button>
              </motion.div>
            </CardContent>

            {/* Bottom decorative line */}
            <div className="absolute bottom-0 left-0 h-1 w-full bg-linear-to-r from-transparent via-primary/20 to-transparent" />
          </Card>

          {/* Shadow that also reacts to 3D movement */}
          <motion.div
            style={{
              rotateX,
              rotateY,
              translateZ: "-50px",
              filter: "blur(40px)",
            }}
            className="absolute inset-x-8 -bottom-10 h-12 bg-black/20 dark:bg-primary/5 -z-10 rounded-full"
          />
        </motion.div>

        <style jsx global>{`
          @keyframes spin-slow {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          .animate-spin-slow {
            animation: spin-slow 8s linear infinite;
          }
        `}</style>
      </div>
      <Footer />
    </main>
  );
}
