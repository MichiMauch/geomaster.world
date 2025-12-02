import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { games, gameRounds, guesses, userStats } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { calculateScore } from "@/lib/score";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { gameId } = body;

    if (!gameId) {
      return NextResponse.json(
        { error: "Game ID is required" },
        { status: 400 }
      );
    }

    // Get the game
    const game = await db
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .get();

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Check ownership
    if (game.mode !== "solo" || game.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only complete your own solo games" },
        { status: 403 }
      );
    }

    if (game.status !== "active") {
      return NextResponse.json(
        { error: "Game is already completed" },
        { status: 400 }
      );
    }

    // Get all guesses for this game to calculate stats
    const gameGuesses = await db
      .select({
        distanceKm: guesses.distanceKm,
        gameType: gameRounds.gameType,
      })
      .from(guesses)
      .innerJoin(gameRounds, eq(guesses.gameRoundId, gameRounds.id))
      .where(
        and(
          eq(gameRounds.gameId, gameId),
          eq(guesses.userId, session.user.id)
        )
      );

    const totalDistance = gameGuesses.reduce((sum, g) => sum + g.distanceKm, 0);
    const roundsPlayed = gameGuesses.length;
    const totalScore = gameGuesses.reduce((sum, g) => {
      const gameType = g.gameType || game.gameType || "country:switzerland";
      return sum + calculateScore(g.distanceKm, gameType);
    }, 0);

    // Update game status
    await db
      .update(games)
      .set({ status: "completed" })
      .where(eq(games.id, gameId));

    // Update user stats for this game type
    const effectiveGameType = game.gameType || "country:switzerland";

    const existingStats = await db
      .select()
      .from(userStats)
      .where(
        and(
          eq(userStats.userId, session.user.id),
          eq(userStats.gameType, effectiveGameType)
        )
      )
      .get();

    const now = new Date();

    if (existingStats) {
      // Update existing stats
      const newTotalGames = existingStats.totalGames + 1;
      const newTotalRounds = existingStats.totalRounds + roundsPlayed;
      const newTotalDistance = existingStats.totalDistance + totalDistance;
      const newTotalScore = existingStats.totalScore + Math.round(totalScore);
      const newBestScore = Math.max(existingStats.bestScore, Math.round(totalScore));

      await db
        .update(userStats)
        .set({
          totalGames: newTotalGames,
          totalRounds: newTotalRounds,
          totalDistance: newTotalDistance,
          totalScore: newTotalScore,
          bestScore: newBestScore,
          averageDistance: newTotalRounds > 0 ? newTotalDistance / newTotalRounds : 0,
          updatedAt: now,
        })
        .where(eq(userStats.id, existingStats.id));
    } else {
      // Create new stats entry
      await db.insert(userStats).values({
        id: nanoid(),
        userId: session.user.id,
        gameType: effectiveGameType,
        totalGames: 1,
        totalRounds: roundsPlayed,
        totalDistance: totalDistance,
        totalScore: Math.round(totalScore),
        bestScore: Math.round(totalScore),
        averageDistance: roundsPlayed > 0 ? totalDistance / roundsPlayed : 0,
        updatedAt: now,
      });
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalDistance,
        roundsPlayed,
        totalScore: Math.round(totalScore),
        averageDistance: roundsPlayed > 0 ? totalDistance / roundsPlayed : 0,
      },
    });
  } catch (error) {
    console.error("Error completing solo game:", error);
    return NextResponse.json(
      { error: "Failed to complete solo game" },
      { status: 500 }
    );
  }
}
