"use client";

import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import {
  ArrowRight,
  BarChart,
  CreditCard,
  FileText,
  Globe,
  Menu,
  PlayCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import UserButton from "./user-button";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { LinkAsChild } from "../common/LinkAsChild";
import Logo from "../logo";

const products = [
  {
    name: "CV Optimization",
    description: "Tailored resumes for roles that actually matter",
    href: "#",
    icon: FileText,
  },
  {
    name: "Interview Simulator",
    description: "Practice with context, not generic questions",
    href: "#",
    icon: Zap,
  },
  {
    name: "Skill Gap Analysis",
    description: "A clear view of what to improve next",
    href: "#",
    icon: BarChart,
  },
  {
    name: "Job Discovery",
    description: "Relevant opportunities, across borders",
    href: "#",
    icon: Globe,
  },
];

const callsToAction = [
  {
    name: "Explore Plans",
    href: "#",
    icon: CreditCard,
    description: "Choose the plan that's right for you",
  },
  {
    name: "Start Free",
    href: "#",
    icon: PlayCircle,
    description: "Start your free trial today",
  },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <header className="bg-background border-b sticky top-0 left-0 z-50">
      <nav
        aria-label="Global"
        className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
      >
        {/* LOGO */}
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">Chambear.ai</span>
            <Logo />
          </Link>
        </div>

        {/* MOBILE MENU */}
        <div className="flex lg:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="-m-2.5 p-2.5 text-muted-foreground hover:text-foreground"
              >
                <span className="sr-only">Open main menu</span>
                <Menu className="h-6 w-6" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full sm:max-w-sm bg-background overflow-y-auto"
            >
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SheetDescription className="sr-only">
                Mobile navigation menu
              </SheetDescription>

              <div className="mt-6 flow-root">
                <div className="-my-6 divide-y divide-border">
                  <div className="space-y-2 py-6 px-3">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="product" className="border-none">
                        <AccordionTrigger className="py-2 text-base font-semibold hover:no-underline hover:bg-accent rounded-lg text-foreground">
                          Product
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="flex flex-col space-y-2 pl-4 mt-2">
                            {[...products, ...callsToAction].map((item) => (
                              <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className="block rounded-lg py-2 pl-6 pr-3 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-accent"
                              >
                                <span className="flex items-center gap-2">
                                  <item.icon className="h-4 w-4" />
                                  {item.name}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <Link
                      href="#"
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-foreground hover:bg-accent cursor-pointer"
                    >
                      Features
                    </Link>
                    <Link
                      href="#"
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-foreground hover:bg-accent cursor-pointer"
                    >
                      How it Works
                    </Link>
                    <Link
                      href="#"
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-foreground hover:bg-accent cursor-pointer"
                    >
                      Company
                    </Link>
                  </div>
                  <div className="py-6 px-3">
                    <SignedOut>
                      <div className="flex flex-col gap-3">
                        <SignInButton mode="modal">
                          <Button
                            variant="ghost"
                            className="w-full justify-start -mx-3 px-3 text-base"
                          >
                            Log in
                          </Button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                          <Button className="w-full justify-start -mx-3 px-3 text-base">
                            Get Started
                          </Button>
                        </SignUpButton>
                      </div>
                    </SignedOut>
                    <SignedIn>
                      <div className="flex items-center gap-4 py-2">
                        <UserButton />
                        <span className="text-sm font-semibold text-muted-foreground">
                          Manage Account
                        </span>
                      </div>
                    </SignedIn>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* DESKTOP NAV */}
        <div className="hidden lg:flex lg:gap-x-12">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-sm font-semibold text-muted-foreground hover:text-primary data-[state=open]:text-primary">
                  Product
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-screen max-w-md rounded-3xl bg-popover text-popover-foreground shadow-lg ring-1 ring-border overflow-hidden">
                    <div className="p-4">
                      {products.map((item) => (
                        <div
                          key={item.name}
                          className="group relative flex items-center gap-x-6 rounded-lg p-4 text-sm hover:bg-accent"
                        >
                          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted group-hover:bg-background">
                            <item.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                          </div>
                          <div className="flex-auto">
                            <Link
                              href={item.href}
                              className="block font-semibold text-foreground"
                            >
                              {item.name}
                              <span className="absolute inset-0" />
                            </Link>
                            <p className="mt-1 text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      ))}
                      {callsToAction.map((item) => (
                        <div
                          key={item.name}
                          className="group relative flex items-center gap-x-6 rounded-lg p-4 text-sm hover:bg-accent"
                        >
                          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted group-hover:bg-background">
                            <item.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                          </div>
                          <div className="flex-auto">
                            <Link
                              href={item.href}
                              className="block font-semibold text-foreground"
                            >
                              {item.name}
                              <span className="absolute inset-0" />
                            </Link>
                            <p className="mt-1 text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <LinkAsChild href="#" asChild>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "bg-transparent text-muted-foreground hover:text-primary font-semibold"
                    )}
                  >
                    Features
                  </NavigationMenuLink>
                </LinkAsChild>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <LinkAsChild href="#" asChild>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "bg-transparent text-muted-foreground hover:text-primary font-semibold"
                    )}
                  >
                    How it Works
                  </NavigationMenuLink>
                </LinkAsChild>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <LinkAsChild href="#" asChild>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "bg-transparent text-muted-foreground hover:text-primary font-semibold"
                    )}
                  >
                    Company
                  </NavigationMenuLink>
                </LinkAsChild>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* LOGIN */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <div className="flex items-center gap-4">
              <SignInButton mode="modal">
                <Button variant="ghost">Log in</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button>
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </SignUpButton>
            </div>
          </SignedOut>
        </div>
      </nav>
    </header>
  );
}
