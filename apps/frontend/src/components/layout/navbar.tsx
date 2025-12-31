"use client";

import {
  Blocks,
  Fingerprint,
  Menu,
  MousePointer2,
  Phone,
  PieChart,
  PlayCircle,
  RefreshCcw,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

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
    name: "Analytics",
    description: "Get a better understanding of your traffic",
    href: "#",
    icon: PieChart,
  },
  {
    name: "Engagement",
    description: "Speak directly to your customers",
    href: "#",
    icon: MousePointer2,
  },
  {
    name: "Security",
    description: "Your customers’ data will be safe and secure",
    href: "#",
    icon: Fingerprint,
  },
  {
    name: "Integrations",
    description: "Connect with third-party tools",
    href: "#",
    icon: Blocks,
  },
  {
    name: "Automations",
    description: "Build strategic funnels that will convert",
    href: "#",
    icon: RefreshCcw,
  },
];

const callsToAction = [
  { name: "Watch demo", href: "#", icon: PlayCircle },
  { name: "Contact sales", href: "#", icon: Phone },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    // CAMBIO 1: bg-white/dark:bg-gray-900 -> bg-background
    <header className="bg-background border-b">
      <nav
        aria-label="Global"
        className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
      >
        {/* LOGO */}
        <div className="flex lg:flex-1">
          <Link href="#" className="-m-1.5 p-1.5">
            <span className="sr-only">Chambear.ai</span>
            <Logo />
          </Link>
        </div>

        {/* MOBILE MENU TRIGGER */}
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
              // CAMBIO 2: bg-white -> bg-background
              className="w-full sm:max-w-sm bg-background overflow-y-auto"
            >
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SheetDescription className="sr-only">
                Mobile navigation menu
              </SheetDescription>

              <div className="mt-6 flow-root">
                <div className="-my-6 divide-y divide-border">
                  <div className="space-y-2 py-6">
                    {/* MOBILE ACCORDION */}
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1" className="border-none">
                        {/* CAMBIO 3: hover manuales -> hover:bg-accent */}
                        <AccordionTrigger className="py-2 text-base font-semibold hover:no-underline hover:bg-accent px-3 rounded-lg text-foreground">
                          Product
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="flex flex-col space-y-2 pl-4 mt-2">
                            {[...products, ...callsToAction].map((item) => (
                              <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                // CAMBIO 4: Textos y hovers semánticos
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
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-foreground hover:bg-accent"
                    >
                      Features
                    </Link>
                    <Link
                      href="#"
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-foreground hover:bg-accent"
                    >
                      Marketplace
                    </Link>
                    <Link
                      href="#"
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-foreground hover:bg-accent"
                    >
                      Company
                    </Link>
                  </div>
                  <div className="py-6">
                    <Link
                      href="#"
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold text-foreground hover:bg-accent"
                    >
                      Log in
                    </Link>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* DESKTOP NAVIGATION MENU */}
        <div className="hidden lg:flex lg:gap-x-12">
          <NavigationMenu>
            <NavigationMenuList>
              {/* DROPDOWN PRODUCT */}
              <NavigationMenuItem>
                {/* CAMBIO 5: Trigger usando colores muted/foreground y primary para hover */}
                <NavigationMenuTrigger className="bg-transparent text-sm font-semibold text-muted-foreground hover:bg-transparent hover:text-primary focus:bg-transparent data-[state=open]:bg-transparent data-[state=open]:text-primary">
                  Product
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  {/* CAMBIO 6: Contenedor del Popover usando bg-popover */}
                  <div className="w-screen max-w-md overflow-hidden rounded-3xl bg-popover text-popover-foreground shadow-lg ring-1 ring-border">
                    <div className="p-4">
                      {products.map((item) => (
                        <div
                          key={item.name}
                          // CAMBIO 7: Items internos usando hover:bg-accent
                          className="group relative flex items-center gap-x-6 rounded-lg p-4 text-sm leading-6 hover:bg-accent"
                        >
                          {/* Icon container: bg-muted -> group-hover:bg-background/popover */}
                          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-muted group-hover:bg-background">
                            <item.icon
                              // Colores del icono: muted-foreground -> primary
                              className="h-6 w-6 text-muted-foreground group-hover:text-primary"
                              aria-hidden="true"
                            />
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
                    {/* CAMBIO 8: Footer del dropdown (CTA) */}
                    <div className="grid grid-cols-2 divide-x divide-border bg-muted/50">
                      {callsToAction.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="flex items-center justify-center gap-x-2.5 p-3 text-sm font-semibold leading-6 text-foreground hover:bg-accent hover:text-accent-foreground"
                        >
                          <item.icon
                            className="h-5 w-5 flex-none text-muted-foreground"
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* STANDARD LINKS */}
              <NavigationMenuItem>
                <LinkAsChild href="#" asChild>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "bg-transparent hover:bg-transparent text-muted-foreground hover:text-primary font-semibold"
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
                      "bg-transparent hover:bg-transparent text-muted-foreground hover:text-primary font-semibold"
                    )}
                  >
                    Marketplace
                  </NavigationMenuLink>
                </LinkAsChild>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <LinkAsChild href="#" asChild>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "bg-transparent hover:bg-transparent text-muted-foreground hover:text-primary font-semibold"
                    )}
                  >
                    Company
                  </NavigationMenuLink>
                </LinkAsChild>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* LOGIN BUTTON */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <Link
            href="/auth"
            className="text-sm font-semibold leading-6 text-foreground hover:text-primary transition-colors"
          >
            Log in <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
