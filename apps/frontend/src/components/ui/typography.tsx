import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type TypographyVariant = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";

export interface TypographyProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  variant?: TypographyVariant;
  className?: string;
}

/**
 * Variant → Tailwind classes
 * Fonts are controlled by CSS slots:
 * - font-heading
 * - font-ui
 * - font-display (optional for hero usage)
 */
const variantClasses: Record<TypographyVariant, string> = {
  h1: cn(
    "font-heading",
    "scroll-m-20",
    "text-4xl md:text-5xl lg:text-6xl",
    "font-bold",
    "tracking-tight",
    "leading-[1.05]",
  ),
  h2: cn(
    "font-heading",
    "scroll-m-20",
    "border-b pb-2",
    "text-3xl md:text-4xl",
    "font-semibold",
    "tracking-tight",
    "first:mt-0",
  ),
  h3: cn(
    "font-heading",
    "scroll-m-20",
    "text-2xl md:text-3xl",
    "font-semibold",
    "tracking-tight",
  ),
  h4: cn(
    "font-heading",
    "scroll-m-20",
    "text-xl md:text-2xl",
    "font-semibold",
    "tracking-tight",
  ),
  h5: cn("font-heading", "scroll-m-20", "text-lg", "font-semibold"),
  h6: cn("font-heading", "scroll-m-20", "text-base", "font-semibold"),
  p: cn("font-ui", "text-base", "leading-7", "[&:not(:first-child)]:mt-6"),
  span: cn("font-ui", "text-base"),
};

export default function Typography({
  children,
  variant = "p",
  className,
  ...props
}: TypographyProps) {
  const Component = variant;

  return (
    <Component className={cn(variantClasses[variant], className)} {...props}>
      {children}
    </Component>
  );
}
