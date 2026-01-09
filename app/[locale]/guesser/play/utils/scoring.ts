import { getGameTypeConfig } from "@/lib/game-types";

/**
 * Calculate score client-side for guest players
 * Uses the same time-based scoring formula as the server (v2)
 */
export function calculateClientScore(
  distanceKm: number,
  timeSeconds: number,
  gameType: string,
  scoreScaleFactor?: number
): number {
  const maxPoints = 100;
  const config = getGameTypeConfig(gameType);
  const scaleFactor = scoreScaleFactor ?? config.scoreScaleFactor;

  // Calculate base distance score
  const distanceScore = maxPoints * Math.exp(-distanceKm / scaleFactor);

  // Calculate time multiplier (same as server v2)
  const timeMultiplier = 1.0 + Math.min(2.0, 3 / (timeSeconds + 0.1));

  const finalScore = distanceScore * timeMultiplier;
  return Math.round(finalScore);
}
