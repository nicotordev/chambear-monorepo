"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { AlertCircle, Home, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const rotateX = useSpring(
    useTransform(y, [-0.5, 0.5], [15, -15]),
    springConfig,
  );
  const rotateY = useSpring(
    useTransform(x, [-0.5, 0.5], [-15, 15]),
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
    <main className="flex flex-col min-h-svh bg-background text-foreground selection:bg-primary/30">
      <Navbar />

      <div
        className="relative flex-1 flex items-center justify-center overflow-hidden px-4"
        style={{ perspective: "1200px" }}
      >
        {/* Error ambient background */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-32 top-1/4 h-128 w-lg rounded-full bg-destructive/20 blur-[100px]"
          />
          <motion.div
            animate={{
              scale: [1.3, 1, 1.3],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-32 bottom-1/4 h-144 w-xl rounded-full bg-primary/10 blur-[100px]"
          />
        </div>

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
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 w-full max-w-2xl"
        >
          <Card className="relative overflow-hidden border-destructive/20 bg-card/60 backdrop-blur-xl shadow-2xl">
            {/* Error Spotlight */}
            <motion.div
              className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300"
              style={{
                opacity: isHovered ? 1 : 0,
                background: useTransform(
                  [mouseX, mouseY],
                  ([mx, my]) =>
                    `radial-gradient(600px circle at ${mx}px ${my}px, rgba(var(--destructive-rgb), 0.08), transparent 40%)`,
                ),
              }}
            />

            <CardHeader className="relative space-y-4 text-center py-10">
              <motion.div
                style={{ translateZ: "50px" }}
                className="flex justify-center"
              >
                <Badge
                  variant="destructive"
                  className="px-3 py-1 gap-2 bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15"
                >
                  <AlertCircle className="h-4 w-4 animate-pulse" />
                  Error Crítico del Sistema
                </Badge>
              </motion.div>

              <motion.h1
                style={{ translateZ: "80px" }}
                className="text-balance font-heading text-5xl font-bold tracking-tighter sm:text-6xl text-foreground"
              >
                Algo salió mal
              </motion.h1>

              <motion.p
                style={{ translateZ: "40px" }}
                className="mx-auto max-w-[85%] text-muted-foreground text-sm sm:text-base leading-relaxed"
              >
                Hemos detectado una anomalía en el flujo de datos. Nuestros
                ingenieros espaciales ya están trabajando en la reparación.
              </motion.p>
            </CardHeader>

            <CardContent className="relative space-y-8 pb-12">
              <motion.div
                style={{ translateZ: "60px" }}
                className="flex flex-wrap items-center justify-center gap-4"
              >
                <Button
                  size="lg"
                  onClick={() => reset()}
                  className="group h-12 px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                >
                  <RefreshCcw className="mr-2 h-4 w-4 transition-transform group-hover:rotate-180 duration-500" />
                  Reintentar
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="h-12 px-8 border-border/50 hover:bg-accent/50 backdrop-blur-sm"
                >
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Ir al Inicio
                  </Link>
                </Button>
              </motion.div>

              {error.digest && (
                <motion.p
                  style={{ translateZ: "20px" }}
                  className="text-center text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest"
                >
                  ID de Error: {error.digest}
                </motion.p>
              )}
            </CardContent>

            <div className="absolute top-0 left-0 h-0.5 w-full bg-linear-to-r from-transparent via-destructive/30 to-transparent" />
          </Card>

          {/* Glitch Shadow */}
          <motion.div
            style={{
              rotateX,
              rotateY,
              translateZ: "-60px",
              filter: "blur(50px)",
            }}
            className="absolute inset-x-12 -bottom-10 h-16 bg-destructive/10 -z-10 rounded-full"
          />
        </motion.div>
      </div>

      <Footer />

      <style jsx global>{`
        :root {
          --destructive-rgb: 239, 68, 68;
        }
      `}</style>
    </main>
  );
}
