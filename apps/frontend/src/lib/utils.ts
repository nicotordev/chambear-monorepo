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
