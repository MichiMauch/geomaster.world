import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { activityLogger } from "@/lib/activity-logger";
import { games, guesses, gameRounds, rankedGameResults, users } from "@/lib/db/schema";
import { eq, and, sum } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { DuelService } from "@/lib/services/duel-service";
import { getDisplayName } from "@/lib/utils";
import { encodeDuelChallenge, type DuelChallenge } from "@/lib/duel-utils";

/**
 * POST /api/ranked/games/duel/complete
 * Complete a duel game
 *
 * Body for challenger (generating share link):
 *   { gameId: string }
 *   Returns: encoded challenge string for sharing
 *
 * Body for accepter (completing duel):
 *   { gameId: string, challengeData: DuelChallenge }
 *   Returns: duelId for viewing results
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { gameId, challengeData } = body;

    if (!gameId) {
      return NextResponse.json(
        { error: "gameId is required" },
        { status: 400 }
      );
    }

    // Fetch the game
    const game = await db.select().from(games).where(eq(games.id, gameId)).get();

    if (!game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (game.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Not your game" },
        { status: 403 }
      );
    }

    // Verify duel mode
    if (game.mode !== "duel") {
      return NextResponse.json(
        { error: "Not a duel game" },
        { status: 400 }
      );
    }

    // Calculate total score and time for this game
    const rounds = await db
      .select({ id: gameRounds.id })
      .from(gameRounds)
      .where(eq(gameRounds.gameId, gameId));

    let totalScore = 0;
    let totalTime = 0;
    let totalDistance = 0;

    for (const round of rounds) {
      const guess = await db
        .select()
        .from(guesses)
        .where(and(eq(guesses.gameRoundId, round.id), eq(guesses.userId, session.user.id)))
        .get();

      if (guess) {
        // Calculate score from distance (simplified - you may want to use your actual scoring function)
        // For now, we'll store it and retrieve from the guess if you have a score field
        // Or calculate based on distance
        totalTime += guess.timeSeconds || 0;
        totalDistance += guess.distanceKm;
      }
    }

    // Get the total score from rankedGameResults if already recorded, or calculate
    const existingResult = await db
      .select()
      .from(rankedGameResults)
      .where(eq(rankedGameResults.gameId, gameId))
      .get();

    if (existingResult) {
      totalScore = existingResult.totalScore;
      totalDistance = existingResult.totalDistance;
    }

    // Mark game as completed
    await db.update(games).set({ status: "completed" }).where(eq(games.id, gameId));

    // Get user details
    const user = await db.select().from(users).where(eq(users.id, session.user.id)).get();
    const displayName = user ? getDisplayName(user.name, user.nickname) : "Anonym";

    // If no challengeData provided, this is the challenger completing their game
    // Generate and return the share link
    if (!challengeData) {
      const challenge: DuelChallenge = {
        seed: game.duelSeed!,
        gameType: game.gameType!,
        challengerId: session.user.id,
        challengerName: displayName,
        challengerScore: totalScore,
        challengerTime: totalTime,
        challengerGameId: gameId,
      };

      const encodedChallenge = encodeDuelChallenge(challenge);

      // Log game completed
      activityLogger.logGame("completed", session.user.id, gameId, {
        gameType: game.gameType,
        mode: "duel",
        role: "challenger",
        score: totalScore,
      }).catch(() => {});

      return NextResponse.json({
        role: "challenger",
        encodedChallenge,
        challengerScore: totalScore,
        challengerTime: totalTime,
        gameType: game.gameType,
      });
    }

    // If challengeData provided, this is the accepter completing the duel
    // Create the duel result
    const typedChallengeData = challengeData as DuelChallenge;

    // Verify the seed matches
    if (typedChallengeData.seed !== game.duelSeed) {
      return NextResponse.json(
        { error: "Duel seed mismatch" },
        { status: 400 }
      );
    }

    // Create the completed duel
    const duelId = await DuelService.completeDuel({
      duelSeed: typedChallengeData.seed,
      gameType: typedChallengeData.gameType,
      challengerId: typedChallengeData.challengerId,
      challengerGameId: typedChallengeData.challengerGameId,
      challengerScore: typedChallengeData.challengerScore,
      challengerTime: typedChallengeData.challengerTime,
      accepterId: session.user.id,
      accepterGameId: gameId,
      accepterScore: totalScore,
      accepterTime: totalTime,
    });

    // Log game completed
    activityLogger.logGame("completed", session.user.id, gameId, {
      gameType: game.gameType,
      mode: "duel",
      role: "accepter",
      score: totalScore,
      duelId,
    }).catch(() => {});

    return NextResponse.json({
      role: "accepter",
      duelId,
      accepterScore: totalScore,
      accepterTime: totalTime,
      challengerScore: typedChallengeData.challengerScore,
      challengerTime: typedChallengeData.challengerTime,
      gameType: game.gameType,
    });
  } catch (error) {
    logger.error("Error completing duel game", error);
    return NextResponse.json(
      { error: "Failed to complete duel game" },
      { status: 500 }
    );
  }
}
