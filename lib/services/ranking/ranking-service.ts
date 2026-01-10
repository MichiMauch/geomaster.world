import { db } from "@/lib/db";
import { rankings, rankedGameResults, users } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDisplayName } from "@/lib/utils";
import { getCurrentPeriodKey, getCurrentPeriodKeys, getPeriodLabel } from "./period-utils";
import { getPeriodStartDate, toSqliteTimestamp } from "./date-filters";
import type {
  RankingPeriod,
  RecordRankedGameParams,
  GetRankingsParams,
  RankingEntry,
  GetUserRankParams,
  UserRankResult,
  TopGameEntry,
  GetTopGamesParams,
  GetUserBestGameRankParams,
  UserGameStats,
  UserStats,
} from "./types";

export class RankingService {
  // Re-export period utilities as static methods for backward compatibility
  static getCurrentPeriodKey = getCurrentPeriodKey;
  static getCurrentPeriodKeys = getCurrentPeriodKeys;
  static getPeriodLabel = getPeriodLabel;

  /**
   * Record a completed ranked game and update rankings
   */
  static async recordRankedGame(params: RecordRankedGameParams): Promise<void> {
    const { gameId, userId, guestId, gameType, totalScore, averageScore, totalDistance } = params;

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
    const periodKeys = getCurrentPeriodKeys(now);

    const user = await db.select().from(users).where(eq(users.id, userId)).get();
    if (!user) return;

    const userName = user.name;
    const userImage = user.image;
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
        rank: null,
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Recalculate ranks for a specific game type, period, and period key
   */
  static async recalculateRanks(gameType: string, period: RankingPeriod, periodKey: string): Promise<void> {
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
      .orderBy(desc(rankings.bestScore), rankings.totalGames, rankings.updatedAt);

    for (let i = 0; i < allRankings.length; i++) {
      const rank = i + 1;
      await db.update(rankings).set({ rank }).where(eq(rankings.id, allRankings[i].id));
    }
  }

  /**
   * Get rankings (leaderboard) for a specific game type and period
   */
  static async getRankings(params: GetRankingsParams): Promise<RankingEntry[]> {
    const { gameType, period, periodKey, limit = 100, offset = 0, sortBy = "best" } = params;
    const key = periodKey || getCurrentPeriodKey(period);

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
    const key = periodKey || getCurrentPeriodKey(period);

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
   */
  static async migrateGuestResults(guestId: string, userId: string): Promise<void> {
    await db
      .update(rankedGameResults)
      .set({ userId, guestId: null })
      .where(eq(rankedGameResults.guestId, guestId));

    const migratedGames = await db
      .select()
      .from(rankedGameResults)
      .where(eq(rankedGameResults.userId, userId));

    for (const game of migratedGames) {
      await this.updateRankingsForUser(userId, game.gameType, game.totalScore, game.averageScore);
    }
  }

  /**
   * Get user's personal stats across all game types
   */
  static async getUserStats(userId: string): Promise<UserStats> {
    const allRankings = await db
      .select()
      .from(rankings)
      .where(and(eq(rankings.userId, userId), eq(rankings.period, "alltime")));

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

    const gameTypeRankings = allRankings.filter((r) => r.gameType !== "overall");
    for (const ranking of gameTypeRankings) {
      gameTypeBreakdown[ranking.gameType] = {
        games: ranking.totalGames,
        bestScore: ranking.bestScore,
        totalScore: ranking.totalScore,
        avgScore: ranking.averageScore,
      };
    }

    if (!overall && gameTypeRankings.length > 0) {
      const totalGames = gameTypeRankings.reduce((sum, r) => sum + r.totalGames, 0);
      const bestScore = Math.max(...gameTypeRankings.map((r) => r.bestScore));
      const totalScore = gameTypeRankings.reduce((sum, r) => sum + r.totalScore, 0);
      const totalScorePoints = gameTypeRankings.reduce((sum, r) => sum + r.averageScore * r.totalGames, 0);
      const averageScore = totalGames > 0 ? totalScorePoints / totalGames : 0;

      overall = { totalGames, bestScore, totalScore, averageScore, rank: null } as unknown as typeof overall;
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
   */
  static async getTopGames(params: GetTopGamesParams): Promise<TopGameEntry[]> {
    const { gameType, period, limit = 10, offset = 0 } = params;
    const startDate = getPeriodStartDate(period);

    const conditions = [eq(rankedGameResults.gameType, gameType)];
    if (startDate) {
      conditions.push(sql`${rankedGameResults.completedAt} >= ${toSqliteTimestamp(startDate)}`);
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
   * Get user's best game rank in the games list
   */
  static async getUserBestGameRank(params: GetUserBestGameRankParams): Promise<number | null> {
    const { userId, gameType, period } = params;
    const startDate = getPeriodStartDate(period);

    const userConditions = [eq(rankedGameResults.gameType, gameType), eq(rankedGameResults.userId, userId)];
    if (startDate) {
      userConditions.push(sql`${rankedGameResults.completedAt} >= ${toSqliteTimestamp(startDate)}`);
    }

    const userBestGame = await db
      .select({ totalScore: rankedGameResults.totalScore })
      .from(rankedGameResults)
      .where(and(...userConditions))
      .orderBy(desc(rankedGameResults.totalScore))
      .limit(1)
      .get();

    if (!userBestGame) return null;

    const allConditions = [eq(rankedGameResults.gameType, gameType)];
    if (startDate) {
      allConditions.push(sql`${rankedGameResults.completedAt} >= ${toSqliteTimestamp(startDate)}`);
    }
    allConditions.push(sql`${rankedGameResults.totalScore} > ${userBestGame.totalScore}`);

    const higherScoreCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(rankedGameResults)
      .where(and(...allConditions))
      .get();

    return (higherScoreCount?.count ?? 0) + 1;
  }

  /**
   * Get user's game stats for a specific game type and period
   */
  static async getUserGameStats(params: GetUserBestGameRankParams): Promise<UserGameStats | null> {
    const { userId, gameType, period } = params;
    const startDate = getPeriodStartDate(period);

    const userConditions = [eq(rankedGameResults.gameType, gameType), eq(rankedGameResults.userId, userId)];
    if (startDate) {
      userConditions.push(sql`${rankedGameResults.completedAt} >= ${toSqliteTimestamp(startDate)}`);
    }

    const userGames = await db
      .select({ totalScore: rankedGameResults.totalScore })
      .from(rankedGameResults)
      .where(and(...userConditions))
      .orderBy(desc(rankedGameResults.totalScore));

    if (userGames.length === 0) return null;

    const gamesCount = userGames.length;
    const bestScore = userGames[0].totalScore;
    const totalScore = userGames.reduce((sum, g) => sum + g.totalScore, 0);

    // Conditions for all games of this type (for rank calculation)
    const allConditions = [eq(rankedGameResults.gameType, gameType)];
    if (startDate) {
      allConditions.push(sql`${rankedGameResults.completedAt} >= ${toSqliteTimestamp(startDate)}`);
    }

    // Count total games of this type (all players)
    const totalGamesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(rankedGameResults)
      .where(and(...allConditions))
      .get();
    const totalGamesCount = totalGamesResult?.count ?? 0;

    // Count games with higher score than user's best (for rank)
    const rankConditions = [...allConditions, sql`${rankedGameResults.totalScore} > ${bestScore}`];
    const higherScoreCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(rankedGameResults)
      .where(and(...rankConditions))
      .get();

    const rank = (higherScoreCount?.count ?? 0) + 1;

    return { gamesCount, bestScore, totalScore, rank, totalGamesCount };
  }
}
