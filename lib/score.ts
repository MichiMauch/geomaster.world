import { getGameTypeConfig } from "./game-types";

/**
 * Calculate score based on distance and game type (v1 - distance-only scoring).
 * Uses exponential decay formula normalized by map size.
 *
 * @deprecated For ranked games, use calculateScore from @/lib/scoring instead.
 * This function is kept for backward compatibility with group games, solo games, and training mode.
 *
 * @param distanceKm - Distance in kilometers
 * @param gameType - Game type ID (e.g., "country:switzerland", "world:capitals")
 * @returns Score from 0-100
 */
export function calculateScore(distanceKm: number, gameType: string): number {
  const maxPoints = 100;
  const config = getGameTypeConfig(gameType);

  // Scale factor from config: at this distance you get ~37% of max points (e^-1)
  // Each game type has its own scale factor based on map/country size
  const scaleFactor = config.scoreScaleFactor;

  const score = maxPoints * Math.exp(-distanceKm / scaleFactor);
  return Math.round(score);
}

/**
 * Get a rating text based on score
 */
export function getScoreRating(score: number): { text: string; color: string } {
  if (score >= 95) return { text: "Perfekt!", color: "text-success" };
  if (score >= 80) return { text: "Ausgezeichnet!", color: "text-success" };
  if (score >= 60) return { text: "Sehr gut!", color: "text-accent" };
  if (score >= 40) return { text: "Gut!", color: "text-accent" };
  if (score >= 20) return { text: "Nicht schlecht", color: "text-text-secondary" };
  return { text: "Weit daneben", color: "text-text-muted" };
}
