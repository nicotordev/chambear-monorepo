"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Briefcase,
  Calendar,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  Send,
  User,
  UserIcon,
  UserPlus,
  ChevronsUpDown,
  LogOut,
  Settings,
  Loader2,
  UploadCloud,
  FilePlus,
} from "lucide-react";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import api from "@/lib/api";
import { useUser as useAppUser } from "@/contexts/user-context";
import CreateDocumentForm from "./create-document-form";
import { cn } from "@/lib/utils";

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

// --- Componente Principal ---
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const {
    currentProfile,
    user: databaseUser,
    switchProfile,
  } = useAppUser();
  const pathname = usePathname();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const profiles = databaseUser?.profiles || [];
  const profileId = currentProfile?.id;

  const { data: documents } = useQuery({
    queryKey: ["documents", profileId],
    queryFn: () => {
      if (!profileId) return Promise.resolve([]);
      return api.getDocuments(profileId);
    },
    enabled: !!profileId,
  });

  const navMain = [
    {
      title: "Panel",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
    },
    {
      title: "Empleos",
      url: "/dashboard/jobs",
      icon: Briefcase,
      isActive: pathname?.startsWith("/dashboard/jobs"),
    },
    {
      title: "Postulaciones",
      url: "/dashboard/applications",
      icon: FileText,
      isActive: pathname?.startsWith("/dashboard/applications"),
    },
    {
      title: "Entrevistas",
      url: "/dashboard/interviews",
      icon: Calendar,
      isActive: pathname?.startsWith("/dashboard/interviews"),
    },
    {
      title: "Recordatorios",
      url: "/dashboard/reminders",
      icon: Bell,
      isActive: pathname?.startsWith("/dashboard/reminders"),
    },
  ];

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
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
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
              {(documents || []).length > 0 ? (
                <>
                  {(documents || []).map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton asChild>
                        <Link href={item.url} target="_blank">
                          <FileText className="size-4" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  {/* Botón extra para agregar más documentos si ya hay lista */}
                  <SidebarMenuItem className="mt-2">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <SidebarMenuButton className="text-muted-foreground border border-dashed border-border hover:bg-muted/50">
                          <UserPlus className="size-4" />
                          <span>Nuevo documento</span>
                        </SidebarMenuButton>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Agregar Documento</DialogTitle>
                        </DialogHeader>
                        <CreateDocumentForm
                          onSuccess={() => setIsDialogOpen(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  </SidebarMenuItem>
                </>
              ) : (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild disabled>
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="size-4 opacity-50" />
                        <span className="truncate text-xs">
                          No hay documentos
                        </span>
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <SidebarMenuButton>
                          <FilePlus className="size-4" />
                          <span className="truncate text-xs">
                            Agregar Documento
                          </span>
                        </SidebarMenuButton>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Agregar Documento</DialogTitle>
                        </DialogHeader>
                        <CreateDocumentForm
                          onSuccess={() => setIsDialogOpen(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  </SidebarMenuItem>
                </>
              )}
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
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 w-full">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group flex w-full items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2 text-left outline-none transition-colors hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring">
              <div className="flex items-center gap-3 overflow-hidden">
                {/* Avatar Fallback */}
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/20 border-2 border-accent text-accent group-hover:bg-accent/30 group-hover:text-accent-foreground transition-colors">
                  {currentProfile?.avatar ? (
                    <Image
                      src={currentProfile?.avatar}
                      alt={databaseUser?.name || "Usuario"}
                      className="size-4"
                      width={500}
                      height={500}
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <UserIcon className="size-4" />
                  )}
                </div>

                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-xs text-muted-foreground">
                    Sesión iniciada
                  </span>
                  <span className="truncate text-sm font-medium leading-none">
                    {databaseUser?.name || "Usuario"}
                  </span>
                </div>
              </div>

              {/* Collapse Icon */}
              <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground/50" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
            align="end"
          >
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 size-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 size-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {profiles.map((profile, index) => (
                <DropdownMenuItem
                  key={profile.id}
                  className={cn(
                    "cursor-pointer",
                    profile.id === currentProfile?.id && "bg-primary",
                  )}
                  onClick={() => switchProfile(profile.id)}
                >
                  {profile.avatar && (
                    <Image
                      src={profile.avatar}
                      alt={profile.id}
                      className="size-4 mr-2 rounded-full"
                      width={16}
                      height={16}
                    />
                  )}
                  <span>
                    {profile.headline
                      ? profile.headline + " " + (index + 1)
                      : "Perfil " + (index + 1)}
                  </span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem className="cursor-pointer">
                <UserPlus className="mr-2 size-4" />
                <span>Crear perfil</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
              <LogOut className="mr-2 size-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
