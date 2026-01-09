import type { RankingPeriod } from "./types";

/**
 * Get the period key for a given date and period type
 * Examples:
 * - daily: "2025-12-24"
 * - weekly: "2025-W52"
 * - monthly: "2025-12"
 * - alltime: "alltime"
 */
export function getCurrentPeriodKey(period: RankingPeriod, date: Date = new Date()): string {
  if (period === "alltime") {
    return "alltime";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  if (period === "daily") {
    return `${year}-${month}-${day}`;
  }

  if (period === "monthly") {
    return `${year}-${month}`;
  }

  if (period === "weekly") {
    // Calculate ISO week number
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return `${year}-W${String(weekNumber).padStart(2, "0")}`;
  }

  return "alltime";
}

/**
 * Get all current period keys (daily, weekly, monthly, alltime)
 */
export function getCurrentPeriodKeys(date: Date = new Date()): Record<RankingPeriod, string> {
  return {
    daily: getCurrentPeriodKey("daily", date),
    weekly: getCurrentPeriodKey("weekly", date),
    monthly: getCurrentPeriodKey("monthly", date),
    alltime: getCurrentPeriodKey("alltime", date),
  };
}

/**
 * Get a human-readable label for a period
 */
export function getPeriodLabel(period: RankingPeriod, periodKey: string, locale: string = "de"): string {
  if (period === "alltime") {
    return locale === "de" ? "Gesamt" : locale === "en" ? "All Time" : "Vse čase";
  }

  if (period === "daily") {
    const date = new Date(periodKey);
    return date.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
  }

  if (period === "weekly") {
    const [year, week] = periodKey.split("-W");
    return locale === "de" ? `Woche ${week}, ${year}` : locale === "en" ? `Week ${week}, ${year}` : `Teden ${week}, ${year}`;
  }

  if (period === "monthly") {
    const date = new Date(periodKey + "-01");
    return date.toLocaleDateString(locale, { year: "numeric", month: "long" });
  }

  return periodKey;
}
