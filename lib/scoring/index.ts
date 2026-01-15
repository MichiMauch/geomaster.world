import { getScoringStrategyByVersion, SCORING_STRATEGIES, ScoringParams } from "./strategies";

/**
 * Current scoring version for new games
 * Increment this when introducing new scoring algorithms
 */
const CURRENT_SCORING_VERSION = 2;

/**
 * Calculate score using the specified scoring version
 * If no version specified, uses current version
 *
 * @param params - Scoring parameters (distance, time, game type, isCorrectCountry for world quizzes)
 * @param version - Scoring version (1 = distance only, 2 = time-based, 3 = world quiz with country hit bonus)
 * @returns Calculated score (0-100 for v1, higher for v2/v3 with time bonuses)
 */
export function calculateScore(params: ScoringParams, version?: number): number {
  const scoringVersion = version ?? CURRENT_SCORING_VERSION;
  const strategy = getScoringStrategyByVersion(scoringVersion);
  return strategy.calculateRoundScore(params);
}

/**
 * Get the current scoring version for new games
 * Use this when creating new ranked games
 */
export function getCurrentScoringVersion(): number {
  return CURRENT_SCORING_VERSION;
}

/**
 * Get scoring strategy metadata
 * Useful for displaying scoring information to users
 */
export function getScoringStrategy(version: number) {
  return getScoringStrategyByVersion(version);
}

/**
 * Get all available scoring versions
 * Useful for documentation or admin panels
 */
export function getAllScoringVersions(): number[] {
  return Object.keys(SCORING_STRATEGIES).map(Number).sort();
}

// Re-export types for external use
export type { ScoringParams, ScoringStrategy } from "./strategies";
