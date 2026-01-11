export interface LevelInfo {
  level: number;
  name: string;
  minPoints: number;
  achieved: boolean;
}

export interface LevelData {
  level: number;
  levelName: string;
  totalPoints: number;
  progress: number;
  pointsToNextLevel: number;
  nextLevel: {
    level: number;
    levelName: string;
  } | null;
  isMaxLevel: boolean;
  streak: {
    current: number;
    longest: number;
    lastPlayedDate: string | null;
  };
  allLevels: LevelInfo[];
}

export const STREAK_MILESTONES = [5, 10, 15, 20, 50, 100];

/** Milliseconds per day (24 * 60 * 60 * 1000) */
export const MS_PER_DAY = 86_400_000;

/**
 * Format points with locale-specific separators
 * DE uses Swiss style with apostrophe: 12'000
 */
export function formatPoints(num: number, locale: string): string {
  if (locale === "de") {
    return num.toLocaleString("de-CH");
  }
  return num.toLocaleString();
}

/**
 * Get tooltip position class based on column index (3-column grid)
 */
export function getTooltipPosition(index: number): string {
  const col = index % 3;
  if (col === 0) return "left-0";
  if (col === 1) return "left-1/2 -translate-x-1/2";
  return "right-0";
}

/**
 * Get tooltip arrow position class based on column index (3-column grid)
 */
export function getArrowPosition(index: number): string {
  const col = index % 3;
  if (col === 0) return "left-6";
  if (col === 1) return "left-1/2 -translate-x-1/2";
  return "right-6";
}
