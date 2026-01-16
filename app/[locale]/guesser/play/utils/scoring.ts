import { getGameTypeConfig } from "@/lib/game-types";

/**
 * Calculate score client-side for guest players
 * Uses the same Fair Time scoring formula as the server (V4)
 * Max 500 points per round (333 base * 1.5 time bonus)
 */
export function calculateClientScore(
  distanceKm: number,
  timeSeconds: number,
  gameType: string,
  scoreScaleFactor?: number
): number {
  const basePoints = 333;
  const timeLimit = 30;
  const config = getGameTypeConfig(gameType);
  // Fallback for dynamic game types (country/world/panorama from DB)
  // Default 3000km is a reasonable world-scale scoring factor
  const scaleFactor = scoreScaleFactor ?? config?.scoreScaleFactor ?? 3000;

  // Calculate base distance score
  const distanceScore = basePoints * Math.exp(-distanceKm / scaleFactor);

  // Calculate time bonus (V4: max 50% bonus for instant answer)
  const clampedTime = Math.max(0, Math.min(timeSeconds, timeLimit));
  const timeBonus = 0.5 * (1 - clampedTime / timeLimit);

  const finalScore = distanceScore * (1 + timeBonus);
  return Math.round(finalScore);
}
