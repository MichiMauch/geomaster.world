import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Capitalize first letter of a string
 */
function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Get display name for rankings
 * Priority: nickname (unchanged) > "Firstname L." (capitalized) > "Anonym"
 */
export function getDisplayName(name: string | null, nickname?: string | null): string {
  // Priority 1: Nickname (unchanged)
  if (nickname) return nickname;

  // Priority 2: Formatted name "Firstname L." with proper capitalization
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      const firstName = capitalize(parts[0]);
      const lastInitial = parts[parts.length - 1][0].toUpperCase();
      return `${firstName} ${lastInitial}.`;
    }
    // Single name -> capitalize first letter
    return capitalize(name);
  }

  return "Anonym";
}

/**
 * Fisher-Yates shuffle algorithm for unbiased random array shuffling
 * Returns a new shuffled array without modifying the original
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
