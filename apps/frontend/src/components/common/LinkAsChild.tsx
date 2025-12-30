'use client';

import { Slot } from "@radix-ui/react-slot";
import Link, { LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

export interface LinkAsChildProps extends LinkProps {
  asChild?: boolean;
  children?: React.ReactNode;
}

export const LinkAsChild = React.forwardRef<
  HTMLDivElement | HTMLAnchorElement,
  LinkAsChildProps
>(({ asChild, children, ...props }, ref) => {
  const router = useRouter();

  if (asChild) {
    return (
      <div
        {...(props as any)}
        ref={ref as React.Ref<HTMLDivElement>}
        onClick={() => router.push(props.href as string)}
      >
        <Slot>{children}</Slot>
      </div>
    );
  }

  return (
    <Link {...props} ref={ref as React.Ref<HTMLAnchorElement>}>
      {children}
    </Link>
  );
});
