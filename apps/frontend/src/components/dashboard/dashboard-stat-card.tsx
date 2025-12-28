import { ForwardRefExoticComponent, RefAttributes } from "react";
import { LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface StatCardProps {
  title: string;
  value: number;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  description: string;
  color: "blue" | "purple" | "amber" | "green";
  highlight?: boolean;
  href?: string;
}

export default function DashboardStatCard({
  title,
  value,
  icon: Icon,
  description,
  color,
  highlight = false,
  href,
}: StatCardProps) {
  const colorStyles = {
    blue: "text-blue-600 bg-blue-500/10",
    purple: "text-purple-600 bg-purple-500/10",
    amber: "text-amber-600 bg-amber-500/10",
    green: "text-green-600 bg-green-500/10",
  };

  return (
    <Link
      href={href || "#"}
      className="group relative flex flex-col justify-between bg-background p-6 transition-colors hover:bg-secondary/20"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <h3 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            {value}
          </h3>
        </div>
        <div
          className={cn(
            "rounded-lg p-2 transition-all group-hover:scale-110",
            highlight ? colorStyles[color] : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
      <p className="mt-4 text-xs font-medium text-muted-foreground group-hover:text-foreground/80 transition-colors">
        {description}
      </p>
    </Link>
  );
}
