import Image from "next/image";
import { cn } from "@/lib/utils"; // Standard in shadcn/ui projects

interface LogoProps {
  variant?: "icon" | "full";
  size?: "sm" | "md" | "lg" | "xl";
  alignment?: "left" | "center" | "right";
  className?: string;
}

export default function Logo({
  variant = "icon",
  size = "md",
  alignment = "center",
  className,
}: LogoProps) {
  // Define size configurations
  const sizeMap = {
    sm: { width: 24, height: 24, textSize: "text-base" }, // w-6
    md: { width: 32, height: 32, textSize: "text-xl" }, // w-8
    lg: { width: 48, height: 48, textSize: "text-3xl" }, // w-12
    xl: { width: 64, height: 64, textSize: "text-4xl" }, // w-16
  };

  const { width, height, textSize } = sizeMap[size];

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        alignment === "left"
          ? "justify-start"
          : alignment === "center"
          ? "justify-center"
          : "justify-end",
        className
      )}
    >
      <Image
        src="/assets/img/logo/only-logo/only-logo.png"
        alt="Chambear AI Logo"
        width={width}
        height={height}
        className="object-contain" // Prevents stretching
        priority // Loads immediately since logos are usually above the fold
      />

      {variant === "full" && (
        <span
          className={cn("font-bold tracking-tight text-foreground", textSize)}
        >
          Chambear AI
        </span>
      )}
    </div>
  );
}
