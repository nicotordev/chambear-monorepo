import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Safe helper for date inputs
export const formatDateForInput = (date: Date | undefined | null | unknown) => {
  if (!date || !(date instanceof Date)) return "";
  // Simple timezone adjustment for date inputs (avoids UTC offsets)
  return date.toISOString().split("T")[0];
};

export function getFlagEmoji(location: string | null): string {
  if (!location) return "🌐";
  const loc = location.toLowerCase();
  if (
    loc.includes("remote") ||
    loc.includes("remoto") ||
    loc.includes("anywhere")
  )
    return "🏠";

  const countries: Record<string, string> = {
    chile: "🇨🇱",
    "united states": "🇺🇸",
    usa: "🇺🇸",
    spain: "🇪🇸",
    españa: "🇪🇸",
    argentina: "🇦🇷",
    mexico: "🇲🇽",
    méxico: "🇲🇽",
    colombia: "🇨🇴",
    peru: "🇵🇪",
    perú: "🇵🇪",
    brazil: "🇧🇷",
    brasil: "🇧🇷",
    "united kingdom": "🇬🇧",
    uk: "🇬🇧",
    germany: "🇩🇪",
    france: "🇫🇷",
    canada: "🇨🇦",
    uruguay: "🇺🇾",
    italy: "🇮🇹",
    italia: "🇮🇹",
    portugal: "🇵🇹",
  };

  for (const [name, emoji] of Object.entries(countries)) {
    if (loc.includes(name)) return emoji;
  }

  // If we can't find a direct match, try to see if there's a comma and the last part is a country code or name
  const parts = location.split(",");
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1].trim().toLowerCase();
    if (countries[lastPart]) return countries[lastPart];
  }

  return "📍";
}

export function getCityOnly(location: string | null): string {
  if (!location) return "Remote";
  const parts = location.split(",");
  return parts[0].trim();
}

export function formatEmploymentType(type: string | null | undefined): string {
  if (!type) return "Unknown";

  const map: Record<string, string> = {
    FULL_TIME: "Full Time",
    PART_TIME: "Part Time",
    CONTRACT: "Contract",
    TEMPORARY: "Temporary",
    INTERN: "Internship",
    FREELANCE: "Freelance",
    UNKNOWN: "Unknown",
  };

  return (
    map[type] ||
    type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase())
  );
}
