"use client";

import {
  Bell,
  Briefcase,
  Calendar,
  Command,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  Send,
  User,
} from "lucide-react";
import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Typography from "@/components/ui/typography";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

// Main Navigation - aligned with Dashboard Page Elements
const navMain = [
  {
    title: "Panel", // Dashboard
    url: "/dashboard",
    icon: LayoutDashboard,
    isActive: true,
  },
  {
    title: "Empleos", // "Pegas Recomendadas"
    url: "/dashboard/jobs",
    icon: Briefcase,
    isActive: false,
  },
  {
    title: "Postulaciones", // "Postulaciones Activas"
    url: "/dashboard/applications",
    icon: FileText, // Or maybe a different icon like 'Send' or 'Paperplane' if available
    isActive: false,
  },
  {
    title: "Entrevistas", // "Próxima Entrevista"
    url: "/dashboard/interviews",
    icon: Calendar,
    isActive: false,
  },
  {
    title: "Recordatorios", // "Recordatorios"
    url: "/dashboard/reminders",
    icon: Bell,
    isActive: false,
  },
];

// Documents - aligned with "Mis Documentos"
const navDocuments = [
  {
    name: "CV_FullStack_2025.pdf",
    url: "#",
    icon: User,
  },
  {
    name: "Portfolio_Design.pdf",
    url: "#",
    icon: FileText,
  },
];

// Secondary Navigation
const navSecondary = [
  {
    title: "Ayuda",
    url: "#",
    icon: LifeBuoy,
  },
  {
    title: "Enviar Comentarios",
    url: "#",
    icon: Send,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <Image
                  src="/assets/img/logo/only-logo/only-logo.webp"
                  alt="Chambear AI"
                  width={500}
                  height={500}
                  className="w-full h-full object-contain"
                />
                <span className="sr-only">Chambear AI</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Platform Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={item.isActive}>
                    <a href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Documents Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Mis Documentos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navDocuments.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon className="size-4" />
                      <span className="truncate">{item.name}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Support Section */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {navSecondary.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon className="size-4" />
                      <span className="truncate">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <div className="rounded-md border border-border bg-card px-3 py-2 flex items-center gap-3">
          <div className="size-8 rounded-full bg-accent/20 flex items-center justify-center border border-accent/10">
            <User className="size-4 text-accent" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <Typography
              variant="span"
              className="text-xs text-muted-foreground truncate"
            >
              Sesión iniciada
            </Typography>
            <Typography variant="span" className="text-sm font-medium truncate">
              {user?.fullName}
            </Typography>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
