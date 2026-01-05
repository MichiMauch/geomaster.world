import { db } from "@/lib/db";
import { rankedGameResults } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * GET /api/ranked/leaderboard/predict
 *
 * Predicts the rank a score would achieve in the weekly leaderboard.
 * Used for guest players to show "With X points, you would be rank Y"
 *
 * Query params:
 * - score: The hypothetical score (required)
 * - gameType: The game type (required)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scoreParam = searchParams.get("score");
  const gameType = searchParams.get("gameType");

  if (!scoreParam || !gameType) {
    return NextResponse.json(
      { error: "score and gameType are required" },
      { status: 400 }
    );
  }

  const score = parseInt(scoreParam, 10);
  if (isNaN(score) || score < 0) {
    return NextResponse.json(
      { error: "Invalid score" },
      { status: 400 }
    );
  }

  try {
    // Calculate start of current week (Monday)
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1; // Adjust for Monday start
    startOfWeek.setDate(now.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);
    const startTimestamp = Math.floor(startOfWeek.getTime() / 1000);

    // Count games with higher score in current week
    const higherScoreCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(rankedGameResults)
      .where(
        and(
          eq(rankedGameResults.gameType, gameType),
          sql`${rankedGameResults.completedAt} >= ${startTimestamp}`,
          sql`${rankedGameResults.totalScore} > ${score}`
        )
      )
      .get();

    // Rank = number of games with higher score + 1
    const predictedRank = (higherScoreCount?.count ?? 0) + 1;

    // Also get total games in the period for context
    const totalGamesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(rankedGameResults)
      .where(
        and(
          eq(rankedGameResults.gameType, gameType),
          sql`${rankedGameResults.completedAt} >= ${startTimestamp}`
        )
      )
      .get();

    return NextResponse.json({
      predictedRank,
      totalGames: (totalGamesCount?.count ?? 0) + 1, // +1 including the hypothetical game
      score,
      gameType,
      period: "weekly",
    });
  } catch (error) {
    console.error("Error predicting rank:", error);
    return NextResponse.json(
      { error: "Failed to predict rank" },
      { status: 500 }
    );
  }
}
