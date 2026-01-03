import { db } from "@/lib/db";
import { rankings, rankedGameResults, users, games, guesses, gameRounds } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { calculateScore } from "@/lib/score";
import { getDisplayName } from "@/lib/utils";

export type RankingPeriod = "daily" | "weekly" | "monthly" | "alltime";

export interface RecordRankedGameParams {
  gameId: string;
  userId: string | null;
  guestId: string | null;
  gameType: string;
  totalScore: number;
  averageScore: number;
  totalDistance: number;
}

export interface GetRankingsParams {
  gameType: string; // specific game type OR "overall" for all types combined
  period: RankingPeriod;
  periodKey?: string; // optional, defaults to current period
  limit?: number;
  offset?: number;
  sortBy?: "best" | "total"; // "best" = bestScore (default), "total" = totalScore
}

export interface RankingEntry {
  rank: number;
  userId: string;
  userName: string | null;
  userImage: string | null;
  totalScore: number;
  totalGames: number;
  averageScore: number;
  bestScore: number;
}

export interface GetUserRankParams {
  userId: string;
  gameType: string;
  period: RankingPeriod;
  periodKey?: string;
}

export interface UserRankResult {
  rank: number;
  totalScore: number;
  totalGames: number;
  averageScore: number;
  bestScore: number;
}

export interface TopGameEntry {
  rank: number;
  gameId: string;
  userId: string | null;
  userName: string | null;
  userImage: string | null;
  totalScore: number;
  completedAt: Date;
}

export interface GetTopGamesParams {
  gameType: string;
  period?: RankingPeriod; // optional filter by period (weekly, daily, monthly)
  limit?: number;
  offset?: number;
}

export interface GetUserBestGameRankParams {
  userId: string;
  gameType: string;
  period?: RankingPeriod;
}

export interface UserGameStats {
  gamesCount: number;
  bestScore: number;
  totalScore: number;
  rank: number | null;
}

export class RankingService {
  /**
   * Get the period key for a given date and period type
   * Examples:
   * - daily: "2025-12-24"
   * - weekly: "2025-W52"
   * - monthly: "2025-12"
   * - alltime: "alltime"
   */
  static getCurrentPeriodKey(period: RankingPeriod, date: Date = new Date()): string {
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
  static getCurrentPeriodKeys(date: Date = new Date()): Record<RankingPeriod, string> {
    return {
      daily: this.getCurrentPeriodKey("daily", date),
      weekly: this.getCurrentPeriodKey("weekly", date),
      monthly: this.getCurrentPeriodKey("monthly", date),
      alltime: this.getCurrentPeriodKey("alltime", date),
    };
  }

  /**
   * Get a human-readable label for a period
   */
  static getPeriodLabel(period: RankingPeriod, periodKey: string, locale: string = "de"): string {
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

  /**
   * Record a completed ranked game and update rankings
   */
  static async recordRankedGame(params: RecordRankedGameParams): Promise<void> {
    const { gameId, userId, guestId, gameType, totalScore, averageScore, totalDistance } = params;

    // Insert into rankedGameResults
    await db.insert(rankedGameResults).values({
      id: nanoid(),
      gameId,
      userId,
      guestId,
      gameType,
      totalScore,
      averageScore,
      totalDistance,
      completedAt: new Date(),
    });

    // Only update rankings if user is logged in (not a guest)
    if (userId) {
      await this.updateRankingsForUser(userId, gameType, totalScore, averageScore);
    }
  }

  /**
   * Update rankings for a user after completing a game
   */
  private static async updateRankingsForUser(
    userId: string,
    gameType: string,
    totalScore: number,
    averageScore: number
  ): Promise<void> {
    const now = new Date();
    const periodKeys = this.getCurrentPeriodKeys(now);

    // Get user info for denormalization
    const user = await db.select().from(users).where(eq(users.id, userId)).get();
    if (!user) return;

    const userName = user.name;
    const userImage = user.image;

    // Update rankings for each period (daily, weekly, monthly, alltime) and specific gameType
    const periods: RankingPeriod[] = ["daily", "weekly", "monthly", "alltime"];

    for (const period of periods) {
      const periodKey = periodKeys[period];

      // Update for specific game type
      await this.upsertRanking({
        userId,
        gameType,
        period,
        periodKey,
        totalScore,
        averageScore,
        userName,
        userImage,
      });

      // Update for "overall" (all game types combined)
      await this.upsertRanking({
        userId,
        gameType: "overall",
        period,
        periodKey,
        totalScore,
        averageScore,
        userName,
        userImage,
      });
    }

    // Recalculate ranks for affected periods
    for (const period of periods) {
      const periodKey = periodKeys[period];
      await this.recalculateRanks(gameType, period, periodKey);
      await this.recalculateRanks("overall", period, periodKey);
    }
  }

  /**
   * Upsert a ranking entry (insert or update if exists)
   */
  private static async upsertRanking(params: {
    userId: string;
    gameType: string;
    period: RankingPeriod;
    periodKey: string;
    totalScore: number;
    averageScore: number;
    userName: string | null;
    userImage: string | null;
  }): Promise<void> {
    const { userId, gameType, period, periodKey, totalScore, averageScore, userName, userImage } = params;

    // Check if entry exists
    const existing = await db
      .select()
      .from(rankings)
      .where(
        and(
          eq(rankings.userId, userId),
          eq(rankings.gameType, gameType),
          eq(rankings.period, period),
          eq(rankings.periodKey, periodKey)
        )
      )
      .get();

    if (existing) {
      // Update existing entry
      const newTotalScore = existing.totalScore + totalScore;
      const newTotalGames = existing.totalGames + 1;
      const newAverageScore = newTotalScore / newTotalGames;
      const newBestScore = Math.max(existing.bestScore, totalScore);

      await db
        .update(rankings)
        .set({
          totalScore: newTotalScore,
          totalGames: newTotalGames,
          averageScore: newAverageScore,
          bestScore: newBestScore,
          userName,
          userImage,
          updatedAt: new Date(),
        })
        .where(eq(rankings.id, existing.id));
    } else {
      // Insert new entry
      await db.insert(rankings).values({
        id: nanoid(),
        userId,
        gameType,
        period,
        periodKey,
        totalScore,
        totalGames: 1,
        averageScore,
        bestScore: totalScore,
        userName,
        userImage,
        rank: null, // Will be calculated later
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Recalculate ranks for a specific game type, period, and period key
   * Ranks are assigned based on totalScore (descending)
   * Ties are broken by: totalGames (ascending), then updatedAt (ascending)
   */
  static async recalculateRanks(gameType: string, period: RankingPeriod, periodKey: string): Promise<void> {
    // Fetch all rankings for this game type and period, sorted by totalScore
    const allRankings = await db
      .select()
      .from(rankings)
      .where(
        and(
          eq(rankings.gameType, gameType),
          eq(rankings.period, period),
          eq(rankings.periodKey, periodKey)
        )
      )
      .orderBy(
        desc(rankings.bestScore), // Rank by best single game score
        rankings.totalGames, // Fewer games is better for ties
        rankings.updatedAt // Earlier is better for ties
      );

    // Assign ranks
    for (let i = 0; i < allRankings.length; i++) {
      const rank = i + 1;
      await db
        .update(rankings)
        .set({ rank })
        .where(eq(rankings.id, allRankings[i].id));
    }
  }

  /**
   * Get rankings (leaderboard) for a specific game type and period
   * sortBy: "best" = by bestScore (default), "total" = by totalScore
   */
  static async getRankings(params: GetRankingsParams): Promise<RankingEntry[]> {
    const { gameType, period, periodKey, limit = 100, offset = 0, sortBy = "best" } = params;
    const key = periodKey || this.getCurrentPeriodKey(period);

    const results = await db
      .select({
        rank: rankings.rank,
        userId: rankings.userId,
        userName: users.name,
        nickname: users.nickname,
        userImage: rankings.userImage,
        totalScore: rankings.totalScore,
        totalGames: rankings.totalGames,
        averageScore: rankings.averageScore,
        bestScore: rankings.bestScore,
      })
      .from(rankings)
      .leftJoin(users, eq(rankings.userId, users.id))
      .where(
        and(
          eq(rankings.gameType, gameType),
          eq(rankings.period, period),
          eq(rankings.periodKey, key)
        )
      )
      .orderBy(sortBy === "total" ? desc(rankings.totalScore) : rankings.rank)
      .limit(limit)
      .offset(offset);

    return results.map((r, index) => ({
      rank: sortBy === "total" ? index + 1 : (r.rank ?? 9999),
      userId: r.userId,
      userName: getDisplayName(r.userName, r.nickname),
      userImage: r.userImage,
      totalScore: r.totalScore,
      totalGames: r.totalGames,
      averageScore: r.averageScore,
      bestScore: r.bestScore,
    }));
  }

  /**
   * Get a specific user's rank and stats
   */
  static async getUserRank(params: GetUserRankParams): Promise<UserRankResult | null> {
    const { userId, gameType, period, periodKey } = params;
    const key = periodKey || this.getCurrentPeriodKey(period);

    const result = await db
      .select({
        rank: rankings.rank,
        totalScore: rankings.totalScore,
        totalGames: rankings.totalGames,
        averageScore: rankings.averageScore,
        bestScore: rankings.bestScore,
      })
      .from(rankings)
      .where(
        and(
          eq(rankings.userId, userId),
          eq(rankings.gameType, gameType),
          eq(rankings.period, period),
          eq(rankings.periodKey, key)
        )
      )
      .get();

    if (!result) return null;

    return {
      rank: result.rank ?? 9999,
      totalScore: result.totalScore,
      totalGames: result.totalGames,
      averageScore: result.averageScore,
      bestScore: result.bestScore,
    };
  }

  /**
   * Migrate guest results to a user account after login
   * This transfers all games played as a guest to the user's account
   */
  static async migrateGuestResults(guestId: string, userId: string): Promise<void> {
    // Update all rankedGameResults from guestId to userId
    await db
      .update(rankedGameResults)
      .set({ userId, guestId: null })
      .where(eq(rankedGameResults.guestId, guestId));

    // Fetch all migrated games
    const migratedGames = await db
      .select()
      .from(rankedGameResults)
      .where(eq(rankedGameResults.userId, userId));

    // Recalculate rankings for the user
    for (const game of migratedGames) {
      await this.updateRankingsForUser(userId, game.gameType, game.totalScore, game.averageScore);
    }
  }

  /**
   * Get user's personal stats across all game types
   */
  static async getUserStats(userId: string): Promise<{
    totalGames: number;
    bestScore: number;
    totalScore: number;
    averageScore: number;
    bestRank: number | null;
    gameTypeBreakdown: Record<string, { games: number; bestScore: number; totalScore: number; avgScore: number }>;
  }> {
    const allRankings = await db
      .select()
      .from(rankings)
      .where(
        and(
          eq(rankings.userId, userId),
          eq(rankings.period, "alltime")
        )
      );

    if (allRankings.length === 0) {
      return {
        totalGames: 0,
        bestScore: 0,
        totalScore: 0,
        averageScore: 0,
        bestRank: null,
        gameTypeBreakdown: {},
      };
    }

    let overall = allRankings.find((r) => r.gameType === "overall");
    const gameTypeBreakdown: Record<string, { games: number; bestScore: number; totalScore: number; avgScore: number }> = {};

    // Build game type breakdown from non-"overall" rankings
    const gameTypeRankings = allRankings.filter((r) => r.gameType !== "overall");
    for (const ranking of gameTypeRankings) {
      gameTypeBreakdown[ranking.gameType] = {
        games: ranking.totalGames,
        bestScore: ranking.bestScore,
        totalScore: ranking.totalScore,
        avgScore: ranking.averageScore,
      };
    }

    // If no "overall" ranking exists, calculate it from game-type rankings
    if (!overall && gameTypeRankings.length > 0) {
      const totalGames = gameTypeRankings.reduce((sum, r) => sum + r.totalGames, 0);
      const bestScore = Math.max(...gameTypeRankings.map((r) => r.bestScore));
      const totalScore = gameTypeRankings.reduce((sum, r) => sum + r.totalScore, 0);

      // Calculate weighted average score
      const totalScorePoints = gameTypeRankings.reduce(
        (sum, r) => sum + (r.averageScore * r.totalGames),
        0
      );
      const averageScore = totalGames > 0 ? totalScorePoints / totalGames : 0;

      overall = {
        totalGames,
        bestScore,
        totalScore,
        averageScore,
        rank: null,
      } as any;
    }

    const bestRank = Math.min(...allRankings.map((r) => r.rank).filter((r): r is number => r !== null));

    return {
      totalGames: overall?.totalGames ?? 0,
      bestScore: overall?.bestScore ?? 0,
      totalScore: overall?.totalScore ?? 0,
      averageScore: overall?.averageScore ?? 0,
      bestRank: bestRank === Infinity ? null : bestRank,
      gameTypeBreakdown,
    };
  }

  /**
   * Get top individual games (not aggregated by user)
   * A player can appear multiple times if they have multiple top scores
   */
  static async getTopGames(params: GetTopGamesParams): Promise<TopGameEntry[]> {
    const { gameType, period, limit = 10, offset = 0 } = params;

    // Build date filter for period
    let startDate: Date | undefined;
    if (period && period !== "alltime") {
      const now = new Date();
      startDate = new Date(now);

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
    }

    // Build conditions
    const conditions = [eq(rankedGameResults.gameType, gameType)];
    if (startDate) {
      // SQLite stores timestamp as seconds, getTime() returns milliseconds
      conditions.push(sql`${rankedGameResults.completedAt} >= ${Math.floor(startDate.getTime() / 1000)}`);
    }

    const results = await db
      .select({
        gameId: rankedGameResults.gameId,
        userId: rankedGameResults.userId,
        userName: users.name,
        nickname: users.nickname,
        userImage: users.image,
        totalScore: rankedGameResults.totalScore,
        completedAt: rankedGameResults.completedAt,
      })
      .from(rankedGameResults)
      .leftJoin(users, eq(rankedGameResults.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(rankedGameResults.totalScore), rankedGameResults.completedAt)
      .limit(limit)
      .offset(offset);

    return results.map((r, index) => ({
      rank: offset + index + 1,
      gameId: r.gameId,
      userId: r.userId,
      userName: getDisplayName(r.userName, r.nickname),
      userImage: r.userImage,
      totalScore: r.totalScore,
      completedAt: r.completedAt,
    }));
  }

  /**
   * Get user's best game rank in the games list (not aggregated)
   * Returns the position of the user's highest-scoring game among all games
   */
  static async getUserBestGameRank(params: GetUserBestGameRankParams): Promise<number | null> {
    const { userId, gameType, period } = params;

    // Build date filter for period
    let startDate: Date | undefined;
    if (period && period !== "alltime") {
      const now = new Date();
      startDate = new Date(now);

      if (period === "daily") {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === "weekly") {
        const day = now.getDay();
        const diff = day === 0 ? 6 : day - 1;
        startDate.setDate(now.getDate() - diff);
        startDate.setHours(0, 0, 0, 0);
      } else if (period === "monthly") {
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
      }
    }

    // Build conditions for user's games
    const userConditions = [
      eq(rankedGameResults.gameType, gameType),
      eq(rankedGameResults.userId, userId),
    ];
    if (startDate) {
      userConditions.push(sql`${rankedGameResults.completedAt} >= ${Math.floor(startDate.getTime() / 1000)}`);
    }

    // Get user's best score for this game type and period
    const userBestGame = await db
      .select({ totalScore: rankedGameResults.totalScore })
      .from(rankedGameResults)
      .where(and(...userConditions))
      .orderBy(desc(rankedGameResults.totalScore))
      .limit(1)
      .get();

    if (!userBestGame) {
      return null; // User has no games for this type/period
    }

    // Count how many games have a higher score
    const allConditions = [eq(rankedGameResults.gameType, gameType)];
    if (startDate) {
      allConditions.push(sql`${rankedGameResults.completedAt} >= ${Math.floor(startDate.getTime() / 1000)}`);
    }
    allConditions.push(sql`${rankedGameResults.totalScore} > ${userBestGame.totalScore}`);

    const higherScoreCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(rankedGameResults)
      .where(and(...allConditions))
      .get();

    // Rank = number of games with higher score + 1
    return (higherScoreCount?.count ?? 0) + 1;
  }

  /**
   * Get user's game stats for a specific game type and period
   * Returns: games count, best score, and rank in the games list
   */
  static async getUserGameStats(params: GetUserBestGameRankParams): Promise<UserGameStats | null> {
    const { userId, gameType, period } = params;

    // Build date filter for period
    let startDate: Date | undefined;
    if (period && period !== "alltime") {
      const now = new Date();
      startDate = new Date(now);

      if (period === "daily") {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === "weekly") {
        const day = now.getDay();
        const diff = day === 0 ? 6 : day - 1;
        startDate.setDate(now.getDate() - diff);
        startDate.setHours(0, 0, 0, 0);
      } else if (period === "monthly") {
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
      }
    }

    // Build conditions for user's games
    const userConditions = [
      eq(rankedGameResults.gameType, gameType),
      eq(rankedGameResults.userId, userId),
    ];
    if (startDate) {
      userConditions.push(sql`${rankedGameResults.completedAt} >= ${Math.floor(startDate.getTime() / 1000)}`);
    }

    // Get user's games for this game type and period
    const userGames = await db
      .select({
        totalScore: rankedGameResults.totalScore,
      })
      .from(rankedGameResults)
      .where(and(...userConditions))
      .orderBy(desc(rankedGameResults.totalScore));

    if (userGames.length === 0) {
      return null; // User has no games for this type/period
    }

    const gamesCount = userGames.length;
    const bestScore = userGames[0].totalScore;
    const totalScore = userGames.reduce((sum, g) => sum + g.totalScore, 0);

    // Count how many games have a higher score than user's best
    const allConditions = [eq(rankedGameResults.gameType, gameType)];
    if (startDate) {
      allConditions.push(sql`${rankedGameResults.completedAt} >= ${Math.floor(startDate.getTime() / 1000)}`);
    }
    allConditions.push(sql`${rankedGameResults.totalScore} > ${bestScore}`);

    const higherScoreCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(rankedGameResults)
      .where(and(...allConditions))
      .get();

    const rank = (higherScoreCount?.count ?? 0) + 1;

    return {
      gamesCount,
      bestScore,
      totalScore,
      rank,
    };
  }
}
