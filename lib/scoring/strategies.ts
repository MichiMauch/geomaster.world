import { getGameTypeConfig } from "@/lib/game-types";

export interface ScoringParams {
  distanceKm: number;
  timeSeconds: number | null;
  gameType: string;
  scoreScaleFactor?: number; // Optional override for dynamic game types (e.g., world quizzes from DB)
}

export interface ScoringStrategy {
  version: number;
  name: string;
  description: string;
  calculateRoundScore: (params: ScoringParams) => number;
}

/**
 * v1: Distance-only scoring (legacy)
 * Used by all games created before time-based scoring was introduced
 */
export const DistanceOnlyScoringStrategy: ScoringStrategy = {
  version: 1,
  name: "Distance Only",
  description: "Score based on distance accuracy only",

  calculateRoundScore({ distanceKm, gameType, scoreScaleFactor }: ScoringParams): number {
    const maxPoints = 100;
    const config = getGameTypeConfig(gameType);
    // Fallback for dynamic game types where config might be undefined
    const scaleFactor = scoreScaleFactor ?? config?.scoreScaleFactor ?? 3000;

    const score = maxPoints * Math.exp(-distanceKm / scaleFactor);
    return Math.round(score);
  }
};

/**
 * v2: Time-based scoring (current)
 * Rewards both accuracy and speed
 * Formula: finalScore = distanceScore * timeMultiplier
 * where timeMultiplier = 1 + min(2.0, 3 / (timeSeconds + 0.1))
 */
export const TimeBasedScoringStrategy: ScoringStrategy = {
  version: 2,
  name: "Time-Based Scoring",
  description: "Score based on both distance accuracy and response time",

  calculateRoundScore({ distanceKm, timeSeconds, gameType, scoreScaleFactor }: ScoringParams): number {
    const maxPoints = 100;
    const config = getGameTypeConfig(gameType);
    // Fallback for dynamic game types where config might be undefined
    const scaleFactor = scoreScaleFactor ?? config?.scoreScaleFactor ?? 3000;

    // Calculate base distance score
    const distanceScore = maxPoints * Math.exp(-distanceKm / scaleFactor);

    // Calculate time multiplier (if time is available)
    // timeMultiplier ranges from 1.0 (slow) to 3.0 (instant)
    const timeMultiplier = calculateTimeMultiplier(timeSeconds);

    // Final score = distance score * time multiplier
    const finalScore = distanceScore * timeMultiplier;
    return Math.round(finalScore);
  }
};

/**
 * Calculate time multiplier for scoring
 * Formula: 1 + min(2.0, 3 / (timeSeconds + 0.1))
 *
 * Examples:
 * - Instant (0s): 1 + 2.0 = 3.0x (triple points)
 * - Fast (1s): 1 + 2.0 = 3.0x
 * - Quick (3s): 1 + 0.97 = 1.97x (nearly double points)
 * - Normal (10s): 1 + 0.297 = 1.297x
 * - Slow (30s): 1 + 0.1 = 1.1x (minimal bonus)
 */
function calculateTimeMultiplier(timeSeconds: number | null): number {
  if (timeSeconds === null || timeSeconds === undefined || timeSeconds < 0) {
    return 1.0; // No time data = no bonus
  }

  const baseMultiplier = 1.0;
  const maxBonus = 2.0;
  const bonusMultiplier = Math.min(maxBonus, 3 / (timeSeconds + 0.1));

  return baseMultiplier + bonusMultiplier;
}

/**
 * Registry of all scoring strategies
 */
export const SCORING_STRATEGIES: Record<number, ScoringStrategy> = {
  1: DistanceOnlyScoringStrategy,
  2: TimeBasedScoringStrategy,
};

/**
 * Get a scoring strategy by version
 */
export function getScoringStrategyByVersion(version: number): ScoringStrategy {
  const strategy = SCORING_STRATEGIES[version];
  if (!strategy) {
    console.warn(`Unknown scoring version ${version}, falling back to v1`);
    return SCORING_STRATEGIES[1];
  }
  return strategy;
}
