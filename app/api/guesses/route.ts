import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  guesses,
  gameRounds,
  games,
  groupMembers,
  locations,
  worldLocations,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { calculateDistance } from "@/lib/distance";
import { getTimeoutPenalty } from "@/lib/countries";
import { calculateScore } from "@/lib/score";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");

    if (!gameId) {
      return NextResponse.json(
        { error: "Game ID is required" },
        { status: 400 }
      );
    }

    // Get user's guesses for this game with gameType for score calculation
    const userGuessesRaw = await db
      .select({
        id: guesses.id,
        gameRoundId: guesses.gameRoundId,
        latitude: guesses.latitude,
        longitude: guesses.longitude,
        distanceKm: guesses.distanceKm,
        roundNumber: gameRounds.roundNumber,
        gameType: gameRounds.gameType,
      })
      .from(guesses)
      .innerJoin(gameRounds, eq(guesses.gameRoundId, gameRounds.id))
      .where(
        and(eq(gameRounds.gameId, gameId), eq(guesses.userId, session.user.id))
      );

    // Calculate score for each guess
    const userGuesses = userGuessesRaw.map((guess) => ({
      ...guess,
      score: guess.gameType ? calculateScore(guess.distanceKm, guess.gameType) : 0,
    }));

    return NextResponse.json(userGuesses);
  } catch (error) {
    console.error("Error fetching guesses:", error);
    return NextResponse.json(
      { error: "Failed to fetch guesses" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { gameRoundId, latitude, longitude, timeSeconds, timeout } = body;

    // Get the round and check game membership
    const round = await db
      .select({
        id: gameRounds.id,
        gameId: gameRounds.gameId,
        locationId: gameRounds.locationId,
        locationSource: gameRounds.locationSource,
        roundNumber: gameRounds.roundNumber,
        gameType: gameRounds.gameType,
        groupId: games.groupId,
        currentRound: games.currentRound,
        country: games.country,
      })
      .from(gameRounds)
      .innerJoin(games, eq(gameRounds.gameId, games.id))
      .where(eq(gameRounds.id, gameRoundId))
      .get();

    if (!round) {
      return NextResponse.json({ error: "Round not found" }, { status: 404 });
    }

    // Check if round is released
    if (round.roundNumber > round.currentRound) {
      return NextResponse.json(
        { error: "Diese Runde ist noch nicht freigegeben" },
        { status: 403 }
      );
    }

    // Check membership
    const membership = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, round.groupId),
          eq(groupMembers.userId, session.user.id)
        )
      )
      .get();

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    // Check if user already guessed this round
    const existingGuess = await db
      .select()
      .from(guesses)
      .where(
        and(
          eq(guesses.gameRoundId, gameRoundId),
          eq(guesses.userId, session.user.id)
        )
      )
      .get();

    if (existingGuess) {
      return NextResponse.json(
        { error: "Already guessed this round" },
        { status: 400 }
      );
    }

    // Get location coordinates - query correct table based on locationSource
    let location: { latitude: number; longitude: number } | undefined;

    if (round.locationSource === "worldLocations") {
      const worldLoc = await db
        .select({ latitude: worldLocations.latitude, longitude: worldLocations.longitude })
        .from(worldLocations)
        .where(eq(worldLocations.id, round.locationId))
        .get();
      location = worldLoc;
    } else {
      const countryLoc = await db
        .select({ latitude: locations.latitude, longitude: locations.longitude })
        .from(locations)
        .where(eq(locations.id, round.locationId))
        .get();
      location = countryLoc;
    }

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    // Calculate distance (country-specific penalty for timeout)
    let distanceKm: number;
    if (timeout) {
      distanceKm = getTimeoutPenalty(round.country);
    } else {
      distanceKm = calculateDistance(
        latitude,
        longitude,
        location.latitude,
        location.longitude
      );
    }

    // Save guess
    const guessId = nanoid();
    await db.insert(guesses).values({
      id: guessId,
      gameRoundId,
      userId: session.user.id,
      latitude: timeout ? null : latitude,
      longitude: timeout ? null : longitude,
      distanceKm,
      timeSeconds: timeSeconds || null,
      createdAt: new Date(),
    });

    // Calculate score based on game type
    const effectiveGameType = round.gameType || `country:${round.country}`;
    const score = calculateScore(distanceKm, effectiveGameType);

    return NextResponse.json({
      id: guessId,
      distanceKm,
      score,
      gameType: effectiveGameType,
      targetLatitude: location.latitude,
      targetLongitude: location.longitude,
    });
  } catch (error) {
    console.error("Error creating guess:", error);
    return NextResponse.json(
      { error: "Failed to create guess" },
      { status: 500 }
    );
  }
}
