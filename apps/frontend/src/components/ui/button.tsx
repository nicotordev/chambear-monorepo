import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 ease-in-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md hover:scale-[1.02]",
        destructive:
          "bg-destructive text-white shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive/20 hover:shadow-md",
        outline:
          "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground hover:border-accent",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        foreground: "bg-transparent text-foreground hover:bg-muted",
        subtle:
          "bg-primary/10 text-primary hover:bg-primary/20 hover:shadow-sm",
        glass:
          "bg-background/40 backdrop-blur-md border border-white/20 text-foreground shadow-sm hover:bg-background/60 hover:shadow-md",
        gradient:
          "bg-gradient-to-r from-primary to-accent text-white shadow-md hover:opacity-90 hover:shadow-lg",
        neon: "bg-background border border-primary text-primary shadow-[0_0_10px_rgba(var(--primary),0.5)] hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_20px_rgba(var(--primary),0.7)]",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        xl: "h-12 rounded-lg px-8 text-base has-[>svg]:px-5",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
        full: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
