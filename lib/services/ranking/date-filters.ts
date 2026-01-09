import type { RankingPeriod } from "./types";

/**
 * Get the start date for a given period filter
 * Returns undefined for "alltime" (no date filter)
 */
export function getPeriodStartDate(period: RankingPeriod | undefined): Date | undefined {
  if (!period || period === "alltime") {
    return undefined;
  }

  const now = new Date();
  const startDate = new Date(now);

  if (period === "daily") {
    startDate.setHours(0, 0, 0, 0);
  } else if (period === "weekly") {
    // Start of week (Monday)
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1; // Monday = 0
    startDate.setDate(now.getDate() - diff);
    startDate.setHours(0, 0, 0, 0);
  } else if (period === "monthly") {
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
  }

  return startDate;
}

/**
 * Convert a Date to SQLite timestamp (seconds since epoch)
 */
export function toSqliteTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}
