import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get display name for rankings
 * Priority: nickname > "Firstname L." > "Anonym"
 */
export function getDisplayName(name: string | null, nickname?: string | null): string {
  // Priority 1: Nickname
  if (nickname) return nickname;

  // Priority 2: Formatted name "Firstname L."
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      const firstName = parts[0];
      const lastInitial = parts[parts.length - 1][0];
      return `${firstName} ${lastInitial}.`;
    }
    return name; // Single name -> unchanged
  }

  return "Anonym";
}
