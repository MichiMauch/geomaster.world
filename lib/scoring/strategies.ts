import { getGameTypeConfig } from "@/lib/game-types";

export interface ScoringParams {
  distanceKm: number;
  timeSeconds: number | null;
  gameType: string;
  scoreScaleFactor?: number; // Optional override for dynamic game types (e.g., world quizzes from DB)
  isCorrectCountry?: boolean; // For world quizzes: true if click was inside target country
  timeLimitSeconds?: number; // Time limit for the round (default: 30)
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
 * v3: World Quiz Scoring (for world:* game types)
 * Rewards hitting the correct country with bonus points
 * - Hit correct country: 750 base points * time multiplier
 * - Miss: Distance-based scoring * time multiplier (like v2)
 *
 * Max per round: 750 * 3.0 = 2250 points
 * Max per game: 5 * 2250 = 11,250 points
 */
export const WorldQuizScoringStrategy: ScoringStrategy = {
  version: 3,
  name: "World Quiz Scoring",
  description: "Bonus points for hitting the correct country, distance-based for misses",

  calculateRoundScore({ distanceKm, timeSeconds, scoreScaleFactor, isCorrectCountry }: ScoringParams): number {
    // Base score depends on whether the correct country was hit
    let baseScore: number;

    if (isCorrectCountry === true) {
      // Hit! Award 100 base points (with time multiplier: 100-300 per round)
      baseScore = 100;
    } else {
      // Miss - use distance-based scoring
      const maxPoints = 100;
      const scaleFactor = scoreScaleFactor ?? 3000;
      baseScore = maxPoints * Math.exp(-distanceKm / scaleFactor);
    }

    // Apply time multiplier (1.0 to 3.0x)
    const timeMultiplier = calculateTimeMultiplier(timeSeconds);
    const finalScore = baseScore * timeMultiplier;

    return Math.round(finalScore);
  }
};

/**
 * v4: Fair Time Scoring
 * Precision is the most important factor, time gives a moderate bonus (max 50%)
 * Formula: finalScore = distanceScore * (1 + 0.5 * (1 - time/timeLimit))
 *
 * Max points per round: 500 (333 base * 1.5 time bonus)
 * Max points per game: 2500 (5 rounds * 500)
 *
 * Examples (with 30s time limit):
 * - Instant (0s): Base * 1.5 (50% bonus) = max 500
 * - Quick (15s): Base * 1.25 (25% bonus) = max 417
 * - At limit (30s): Base * 1.0 (no bonus) = max 333
 *
 * This rewards precision more than speed:
 * - Slow + precise = still good score
 * - Fast + precise = highscore
 */
export const FairTimeScoringStrategy: ScoringStrategy = {
  version: 4,
  name: "Fair Time Scoring",
  description: "Precision-focused scoring with moderate time bonus (max 50%, max 500/round)",

  calculateRoundScore({ distanceKm, timeSeconds, gameType, scoreScaleFactor, timeLimitSeconds }: ScoringParams): number {
    const maxPoints = 333; // 333 * 1.5 = ~500 max per round
    const config = getGameTypeConfig(gameType);
    const scaleFactor = scoreScaleFactor ?? config?.scoreScaleFactor ?? 3000;

    // Calculate base distance score
    const baseScore = maxPoints * Math.exp(-distanceKm / scaleFactor);

    // Calculate time bonus (0% to 50%)
    const timeLimit = timeLimitSeconds || 30;
    const time = timeSeconds ?? timeLimit; // No time data = no bonus
    const clampedTime = Math.max(0, Math.min(time, timeLimit));
    const timeBonus = 0.5 * (1 - clampedTime / timeLimit);

    // Final score = base * (1 + timeBonus)
    const finalScore = baseScore * (1 + timeBonus);
    return Math.round(finalScore);
  }
};

// Export the time multiplier calculation for use in UI
export { calculateTimeMultiplier };

/**
 * Registry of all scoring strategies
 */
export const SCORING_STRATEGIES: Record<number, ScoringStrategy> = {
  1: DistanceOnlyScoringStrategy,
  2: TimeBasedScoringStrategy,
  3: WorldQuizScoringStrategy,
  4: FairTimeScoringStrategy,
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
