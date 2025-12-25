import {
  Briefcase,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";

type NavItem = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  badge?: number;
  active?: boolean;
  items?: Array<{
    label: string;
    href?: string;
    active?: boolean;
  }>;
};

const navMain: NavItem[] = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    href: "/dashboard",
    active: true,
  },
  {
    label: "Jobs",
    icon: Briefcase,
    href: "/dashboard/jobs",
    badge: 12,
  },
  {
    label: "Candidates",
    icon: Users,
    href: "/dashboard/candidates",
  },
  {
    label: "AI",
    icon: Sparkles,
    items: [
      { label: "Matches", href: "/dashboard/ai/matches", active: false },
      { label: "Rankings", href: "/dashboard/ai/rankings", active: false },
    ],
  },
];

const navSecondary: NavItem[] = [
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
  { label: "Support", icon: LifeBuoy, href: "/dashboard/support" },
];

export { navMain, navSecondary };
