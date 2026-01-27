import { db } from "@/lib/db";
import { duelResults, duelStats, users, games, guesses, gameRounds } from "@/lib/db/schema";
import { eq, and, desc, sql, sum } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDisplayName } from "@/lib/utils";
import { determineDuelWinner } from "@/lib/duel-utils";
import { NotificationService } from "@/lib/services/notification-service";
import { sendDuelCompletedEmail } from "@/lib/email";

export interface CompleteDuelParams {
  duelSeed: string;
  gameType: string;
  challengerId: string;
  challengerGameId: string;
  challengerScore: number;
  challengerTime: number;
  accepterId: string;
  accepterGameId: string;
  accepterScore: number;
  accepterTime: number;
}

export interface DuelLeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userImage: string | null;
  wins: number;
  losses: number;
  totalDuels: number;
  winRate: number;
  duelPoints: number;
}

export interface DuelResultWithNames {
  id: string;
  duelSeed: string;
  gameType: string;
  challengerId: string;
  challengerName: string;
  challengerScore: number;
  challengerTime: number;
  accepterId: string;
  accepterName: string;
  accepterScore: number;
  accepterTime: number;
  winnerId: string;
  winnerName: string;
  createdAt: Date;
}

export class DuelService {
  /**
   * Complete a duel and record the result
   */
  static async completeDuel(params: CompleteDuelParams): Promise<string> {
    const {
      duelSeed,
      gameType,
      challengerId,
      challengerGameId,
      challengerScore,
      challengerTime,
      accepterId,
      accepterGameId,
      accepterScore,
      accepterTime,
    } = params;

    // Determine winner
    const winnerResult = determineDuelWinner(
      challengerScore,
      challengerTime,
      accepterScore,
      accepterTime
    );
    const winnerId = winnerResult === "challenger" ? challengerId : accepterId;
    const loserId = winnerResult === "challenger" ? accepterId : challengerId;

    // Create duel result
    const duelId = nanoid();
    const now = new Date();

    await db.insert(duelResults).values({
      id: duelId,
      duelSeed,
      gameType,
      challengerId,
      challengerGameId,
      challengerScore,
      challengerTime,
      accepterId,
      accepterGameId,
      accepterScore,
      accepterTime,
      winnerId,
      createdAt: now,
    });

    // Look up both players' current duelPoints BEFORE updating
    const winnerPointsRow = await db
      .select({ duelPoints: duelStats.duelPoints })
      .from(duelStats)
      .where(and(eq(duelStats.userId, winnerId), eq(duelStats.gameType, gameType)))
      .get();
    const loserPointsRow = await db
      .select({ duelPoints: duelStats.duelPoints })
      .from(duelStats)
      .where(and(eq(duelStats.userId, loserId), eq(duelStats.gameType, gameType)))
      .get();

    const winnerCurrentPoints = winnerPointsRow?.duelPoints ?? 0;
    const loserCurrentPoints = loserPointsRow?.duelPoints ?? 0;

    // +3 base for any win, +3 bonus if opponent had >= your points
    const basePoints = 3;
    const bonusPoints = loserCurrentPoints >= winnerCurrentPoints ? 3 : 0;
    const pointsEarned = basePoints + bonusPoints;

    // Update stats for both players
    await this.updateDuelStats(winnerId, gameType, true, pointsEarned, now);
    await this.updateDuelStats(loserId, gameType, false, 0, now);

    // Recalculate ranks for this game type
    await this.recalculateRanks(gameType);

    // Notify challenger about duel completion
    try {
      const challenger = await db.select().from(users).where(eq(users.id, challengerId)).get();
      const accepter = await db.select().from(users).where(eq(users.id, accepterId)).get();

      const challengerName = challenger ? getDisplayName(challenger.name, challenger.nickname) : "Anonym";
      const accepterName = accepter ? getDisplayName(accepter.name, accepter.nickname) : "Anonym";

      // Create in-app notification for challenger
      await NotificationService.notifyDuelCompleted({
        challengerId,
        accepterName,
        duelId,
        winnerId,
        gameType,
        locale: "de", // Default to German
      });

      // Send email to challenger (non-blocking)
      if (challenger?.email) {
        sendDuelCompletedEmail(
          challenger.email,
          challengerName,
          accepterName,
          duelId,
          winnerId === challengerId,
          "de"
        ).catch((err) => console.error("Failed to send duel email:", err));
      }
    } catch (error) {
      // Don't fail duel completion if notification fails
      console.error("Error sending duel notification:", error);
    }

    return duelId;
  }

  /**
   * Update duel stats for a user
   */
  private static async updateDuelStats(
    userId: string,
    gameType: string,
    isWinner: boolean,
    pointsToAdd: number,
    now: Date
  ): Promise<void> {
    // Check if stats exist
    const existingStats = await db
      .select()
      .from(duelStats)
      .where(and(eq(duelStats.userId, userId), eq(duelStats.gameType, gameType)))
      .get();

    if (existingStats) {
      // Update existing stats
      const newTotalDuels = existingStats.totalDuels + 1;
      const newWins = existingStats.wins + (isWinner ? 1 : 0);
      const newLosses = existingStats.losses + (isWinner ? 0 : 1);
      const newWinRate = newTotalDuels > 0 ? newWins / newTotalDuels : 0;

      await db
        .update(duelStats)
        .set({
          totalDuels: newTotalDuels,
          wins: newWins,
          losses: newLosses,
          winRate: newWinRate,
          duelPoints: existingStats.duelPoints + pointsToAdd,
          updatedAt: now,
        })
        .where(eq(duelStats.id, existingStats.id));
    } else {
      // Create new stats entry
      await db.insert(duelStats).values({
        id: nanoid(),
        userId,
        gameType,
        totalDuels: 1,
        wins: isWinner ? 1 : 0,
        losses: isWinner ? 0 : 1,
        winRate: isWinner ? 1 : 0,
        duelPoints: pointsToAdd,
        rank: null,
        updatedAt: now,
      });
    }
  }

  /**
   * Recalculate ranks for all users in a game type
   * Ranks by: wins desc, winRate desc, totalDuels desc
   */
  private static async recalculateRanks(gameType: string): Promise<void> {
    // Get all stats for this game type, ordered
    const allStats = await db
      .select()
      .from(duelStats)
      .where(eq(duelStats.gameType, gameType))
      .orderBy(desc(duelStats.duelPoints), desc(duelStats.wins), desc(duelStats.winRate), desc(duelStats.totalDuels));

    // Update ranks
    for (let i = 0; i < allStats.length; i++) {
      await db
        .update(duelStats)
        .set({ rank: i + 1 })
        .where(eq(duelStats.id, allStats[i].id));
    }
  }

  /**
   * Get duel leaderboard for a game type
   */
  static async getLeaderboard(
    gameType: string,
    limit: number = 50
  ): Promise<DuelLeaderboardEntry[]> {
    const stats = await db
      .select({
        userId: duelStats.userId,
        wins: duelStats.wins,
        losses: duelStats.losses,
        totalDuels: duelStats.totalDuels,
        winRate: duelStats.winRate,
        duelPoints: duelStats.duelPoints,
        rank: duelStats.rank,
        userName: users.name,
        userNickname: users.nickname,
        userImage: users.image,
      })
      .from(duelStats)
      .leftJoin(users, eq(duelStats.userId, users.id))
      .where(eq(duelStats.gameType, gameType))
      .orderBy(desc(duelStats.duelPoints), desc(duelStats.wins), desc(duelStats.winRate))
      .limit(limit);

    return stats.map((stat, index) => ({
      rank: stat.rank ?? index + 1,
      userId: stat.userId,
      userName: getDisplayName(stat.userName, stat.userNickname),
      userImage: stat.userImage,
      wins: stat.wins,
      losses: stat.losses,
      totalDuels: stat.totalDuels,
      winRate: stat.winRate,
      duelPoints: stat.duelPoints,
    }));
  }

  /**
   * Get all-time leaderboard across all game types
   */
  static async getOverallLeaderboard(limit: number = 50): Promise<DuelLeaderboardEntry[]> {
    // Aggregate stats across all game types
    const aggregatedStats = await db
      .select({
        userId: duelStats.userId,
        totalWins: sum(duelStats.wins).mapWith(Number),
        totalLosses: sum(duelStats.losses).mapWith(Number),
        totalDuels: sum(duelStats.totalDuels).mapWith(Number),
        totalDuelPoints: sum(duelStats.duelPoints).mapWith(Number),
      })
      .from(duelStats)
      .groupBy(duelStats.userId)
      .orderBy(desc(sum(duelStats.duelPoints)), desc(sum(duelStats.wins)))
      .limit(limit);

    // Get user details and calculate overall stats
    const results: DuelLeaderboardEntry[] = [];

    for (let i = 0; i < aggregatedStats.length; i++) {
      const stat = aggregatedStats[i];
      const user = await db.select().from(users).where(eq(users.id, stat.userId)).get();

      const totalDuels = stat.totalDuels || 0;
      const wins = stat.totalWins || 0;
      const losses = stat.totalLosses || 0;
      const winRate = totalDuels > 0 ? wins / totalDuels : 0;

      results.push({
        rank: i + 1,
        userId: stat.userId,
        userName: user ? getDisplayName(user.name, user.nickname) : "Anonym",
        userImage: user?.image || null,
        wins,
        losses,
        totalDuels,
        winRate,
        duelPoints: stat.totalDuelPoints || 0,
      });
    }

    return results;
  }

  /**
   * Get a single duel result by ID
   */
  static async getDuelById(duelId: string): Promise<DuelResultWithNames | null> {
    const duel = await db
      .select()
      .from(duelResults)
      .where(eq(duelResults.id, duelId))
      .get();

    if (!duel) return null;

    // Get user names
    const challenger = await db.select().from(users).where(eq(users.id, duel.challengerId)).get();
    const accepter = await db.select().from(users).where(eq(users.id, duel.accepterId)).get();
    const winner = await db.select().from(users).where(eq(users.id, duel.winnerId)).get();

    return {
      id: duel.id,
      duelSeed: duel.duelSeed,
      gameType: duel.gameType,
      challengerId: duel.challengerId,
      challengerName: challenger ? getDisplayName(challenger.name, challenger.nickname) : "Anonym",
      challengerScore: duel.challengerScore,
      challengerTime: duel.challengerTime,
      accepterId: duel.accepterId,
      accepterName: accepter ? getDisplayName(accepter.name, accepter.nickname) : "Anonym",
      accepterScore: duel.accepterScore,
      accepterTime: duel.accepterTime,
      winnerId: duel.winnerId,
      winnerName: winner ? getDisplayName(winner.name, winner.nickname) : "Anonym",
      createdAt: duel.createdAt,
    };
  }

  /**
   * Get user's duel stats for a specific game type
   */
  static async getUserStats(
    userId: string,
    gameType: string
  ): Promise<{ wins: number; losses: number; totalDuels: number; winRate: number; rank: number | null; duelPoints: number } | null> {
    const stats = await db
      .select()
      .from(duelStats)
      .where(and(eq(duelStats.userId, userId), eq(duelStats.gameType, gameType)))
      .get();

    if (!stats) return null;

    return {
      wins: stats.wins,
      losses: stats.losses,
      totalDuels: stats.totalDuels,
      winRate: stats.winRate,
      rank: stats.rank,
      duelPoints: stats.duelPoints,
    };
  }

  /**
   * Calculate total time for a game (sum of all location times)
   */
  static async calculateGameTime(gameId: string, userId: string): Promise<number> {
    const rounds = await db
      .select({ id: gameRounds.id })
      .from(gameRounds)
      .where(eq(gameRounds.gameId, gameId));

    let totalTime = 0;

    for (const round of rounds) {
      const guess = await db
        .select({ timeSeconds: guesses.timeSeconds })
        .from(guesses)
        .where(and(eq(guesses.gameRoundId, round.id), eq(guesses.userId, userId)))
        .get();

      if (guess?.timeSeconds) {
        totalTime += guess.timeSeconds;
      }
    }

    return totalTime;
  }
}
