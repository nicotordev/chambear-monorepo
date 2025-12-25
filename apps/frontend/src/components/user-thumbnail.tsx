import { Briefcase } from "lucide-react";

export interface UserThumbnailProps {
  name?: string;
}

export default function UserThumbnail({ name }: UserThumbnailProps) {
  if (!name) return <Briefcase className="w-5 h-5 opacity-50" />;
  return <span className="font-bold text-chart-1">{name.charAt(0)}</span>;
}
