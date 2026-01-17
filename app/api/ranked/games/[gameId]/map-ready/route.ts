import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { games, gameRounds, guesses } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { isPanoramaGameType } from "@/lib/game-types";

/**
 * POST /api/ranked/games/[gameId]/map-ready
 *
 * Called by the client when the map is fully loaded and visible.
 * Sets locationStartedAt to start the timer.
 *
 * This ensures the timer only starts when the player can actually see the map,
 * preventing unfair timeouts due to slow map loading.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const session = await getServerSession(authOptions);

  // This endpoint is only for logged-in users (server-side timing)
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const { gameId } = await params;
    const body = await request.json();
    const locationIndex = body.locationIndex as number;

    if (!locationIndex || locationIndex < 1 || locationIndex > 5) {
      return NextResponse.json(
        { error: "Invalid location index (must be 1-5)" },
        { status: 400 }
      );
    }

    // Fetch game
    const game = await db
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .get();

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Validate ownership
    if (game.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // If activeLocationIndex doesn't match, update it
    // This handles race conditions where map-ready is called before start-location completes
    if (game.activeLocationIndex !== locationIndex) {
      await db
        .update(games)
        .set({ activeLocationIndex: locationIndex })
        .where(eq(games.id, gameId));
    }

    // Check if timer already started (idempotent - don't restart)
    if (game.locationStartedAt) {
      // Timer already running, return current state
      const allRounds = await db
        .select()
        .from(gameRounds)
        .where(eq(gameRounds.gameId, gameId))
        .orderBy(gameRounds.locationIndex);

      const activeRound = allRounds.find(r => r.locationIndex === locationIndex);
      const gameType = activeRound?.gameType || game.gameType || "country:switzerland";
      const isPanoramaGame = isPanoramaGameType(gameType);
      const defaultTimeLimit = isPanoramaGame ? 60 : 30;
      const timeLimitSeconds = activeRound?.timeLimitSeconds ?? game.timeLimitSeconds ?? defaultTimeLimit;

      const elapsedMs = Date.now() - game.locationStartedAt;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      const timeRemaining = Math.max(0, timeLimitSeconds - elapsedSeconds);

      return NextResponse.json({
        success: true,
        alreadyStarted: true,
        locationStartedAt: game.locationStartedAt,
        serverTimeRemaining: timeRemaining,
      });
    }

    // Verify location hasn't been guessed yet
    const allRounds = await db
      .select()
      .from(gameRounds)
      .where(eq(gameRounds.gameId, gameId))
      .orderBy(gameRounds.locationIndex);

    const activeRound = allRounds.find(r => r.locationIndex === locationIndex);
    if (!activeRound) {
      return NextResponse.json(
        { error: "Round not found" },
        { status: 404 }
      );
    }

    const existingGuess = await db
      .select()
      .from(guesses)
      .where(
        and(
          eq(guesses.gameRoundId, activeRound.id),
          eq(guesses.userId, session.user.id)
        )
      )
      .get();

    if (existingGuess) {
      return NextResponse.json(
        { error: "Location already guessed" },
        { status: 400 }
      );
    }

    // Start the timer NOW
    const now = Date.now();
    await db
      .update(games)
      .set({ locationStartedAt: now })
      .where(eq(games.id, gameId));

    // Calculate time limit
    const gameType = activeRound.gameType || game.gameType || "country:switzerland";
    const isPanoramaGame = isPanoramaGameType(gameType);
    const defaultTimeLimit = isPanoramaGame ? 60 : 30;
    const timeLimitSeconds = activeRound.timeLimitSeconds ?? game.timeLimitSeconds ?? defaultTimeLimit;

    logger.info("Map ready - timer started", {
      gameId,
      locationIndex,
      userId: session.user.id,
      startedAt: now,
    });

    return NextResponse.json({
      success: true,
      locationStartedAt: now,
      serverTimeRemaining: timeLimitSeconds,
    });
  } catch (error) {
    logger.error("Error in map-ready", error);
    return NextResponse.json(
      { error: "Failed to start timer" },
      { status: 500 }
    );
  }
}
