"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/contexts/user-context";
import { useClerk, useUser as useClerkUser } from "@clerk/nextjs";
import {
  Check,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  User,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

/**
 * A custom UserButton component modeled after Clerk's UserButton
 * but adapted to the site's OKLCH design system and context.
 */
export default function UserButton() {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useClerkUser();
  const { signOut, openUserProfile } = useClerk();
  const { profiles, currentProfile, switchProfile, user } = useUser();

  if (!isClerkLoaded || !clerkUser) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />;
  }

  const initials =
    clerkUser.firstName && clerkUser.lastName
      ? `${clerkUser.firstName[0]}${clerkUser.lastName[0]}`
      : clerkUser.emailAddresses[0]?.emailAddress[0]?.toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button asChild variant="default" size="icon" className="rounded-full">
          <Avatar className="border-2 border-foreground">
            <AvatarImage
              src={currentProfile?.avatar || clerkUser.imageUrl}
              alt={clerkUser.fullName || "User Avatar"}
              className="w-full h-full object-cover rounded-full"
            />
            <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-2" align="end" sideOffset={8}>
        <div className="flex items-center gap-3 p-2">
          <Avatar>
            <AvatarImage
              src={currentProfile?.avatar || clerkUser.imageUrl}
              alt={clerkUser.fullName || "User Avatar"}
              className="w-full h-full object-cover rounded-full"
            />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-0.5 overflow-hidden">
            <p className="text-sm font-semibold truncate leading-none">
              {clerkUser.fullName}
            </p>
            <p className="text-xs text-muted-foreground truncate leading-none">
              {clerkUser.emailAddresses[0]?.emailAddress}
            </p>
          </div>
        </div>

        <DropdownMenuSeparator className="my-2" />

        <div className="px-3 py-2 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Zap className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span>Credits</span>
            </div>
            <span className="text-sm font-bold">
              {user?.creditWallet?.balance ?? 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Plan</span>
            </div>
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">
              {user?.subscription?.plan?.name || "Free"}
            </span>
          </div>
        </div>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer gap-2" asChild>
            <Link href="/dashboard" className="w-full flex items-center">
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Dashboard</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer gap-2"
            onClick={() => openUserProfile()}
          >
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Manage Account</span>
          </DropdownMenuItem>

          {profiles.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Switch Profile</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="p-1">
                {profiles.map((profile, index) => (
                  <DropdownMenuItem
                    key={profile.id}
                    className="flex items-center justify-between gap-2 cursor-pointer"
                    onClick={() => switchProfile(profile.id)}
                  >
                    <div className="flex flex-col items-start overflow-hidden">
                      <span className="text-sm font-medium truncate w-full">
                        {profile.headline || `Profile ${index + 1}`}
                      </span>
                      {profile.targetRoles.length > 0 && (
                        <span className="text-[10px] text-muted-foreground truncate w-full">
                          {profile.targetRoles.join(", ")}
                        </span>
                      )}
                    </div>
                    {currentProfile?.id === profile.id && (
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}

          <DropdownMenuItem className="cursor-pointer gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 gap-2"
          onClick={() => signOut({ redirectUrl: "/" })}
        >
          <LogOut className="h-4 w-4" />
          <span className="font-medium">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
