import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  guesses,
  gameRounds,
  games,
  groupMembers,
  locations,
  worldLocations,
  imageLocations,
  panoramaLocations,
  countries,
  worldQuizTypes,
  panoramaTypes,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { calculateDistance, calculatePixelDistance } from "@/lib/distance";
import { calculateScore as calculateScoreV1 } from "@/lib/score";
import { calculateScore } from "@/lib/scoring";
import { isImageGameType, GAME_TYPES, isWorldGameType, isSpecialQuizGameType } from "@/lib/game-types";
import { isPointInCountry as isPointInCountryPolygon } from "@/lib/utils/geo-check";
import { isPointInCountry, isCountryQuizGameType } from "@/lib/polygon-validation";

// Helper function to get scoreScaleFactor from DB for dynamic game types
async function getScoreScaleFactorFromDB(gameType: string): Promise<number | undefined> {
  if (gameType.startsWith("world:")) {
    const worldQuizId = gameType.split(":")[1];
    const worldQuiz = await db
      .select({ scoreScaleFactor: worldQuizTypes.scoreScaleFactor })
      .from(worldQuizTypes)
      .where(eq(worldQuizTypes.id, worldQuizId))
      .get();
    return worldQuiz?.scoreScaleFactor;
  } else if (gameType.startsWith("country:")) {
    const countryId = gameType.split(":")[1];
    const country = await db
      .select({ scoreScaleFactor: countries.scoreScaleFactor })
      .from(countries)
      .where(eq(countries.id, countryId))
      .get();
    return country?.scoreScaleFactor;
  } else if (gameType.startsWith("panorama:")) {
    const panoramaId = gameType.split(":")[1];
    const panorama = await db
      .select({ scoreScaleFactor: panoramaTypes.scoreScaleFactor })
      .from(panoramaTypes)
      .where(eq(panoramaTypes.id, panoramaId))
      .get();
    return panorama?.scoreScaleFactor;
  }
  return undefined;
}

// Helper function to get timeoutPenalty from DB for dynamic game types
async function getTimeoutPenaltyFromDB(gameType: string): Promise<number> {
  // Static config first
  const staticConfig = GAME_TYPES[gameType];
  if (staticConfig) return staticConfig.timeoutPenalty;

  if (gameType.startsWith("country:")) {
    const countryId = gameType.split(":")[1];
    const result = await db
      .select({ timeoutPenalty: countries.timeoutPenalty })
      .from(countries)
      .where(eq(countries.id, countryId))
      .get();
    if (result) return result.timeoutPenalty;
  } else if (gameType.startsWith("world:")) {
    const worldQuizId = gameType.split(":")[1];
    const result = await db
      .select({ timeoutPenalty: worldQuizTypes.timeoutPenalty })
      .from(worldQuizTypes)
      .where(eq(worldQuizTypes.id, worldQuizId))
      .get();
    if (result) return result.timeoutPenalty;
  } else if (gameType.startsWith("panorama:")) {
    const panoramaId = gameType.split(":")[1];
    const result = await db
      .select({ timeoutPenalty: panoramaTypes.timeoutPenalty })
      .from(panoramaTypes)
      .where(eq(panoramaTypes.id, panoramaId))
      .get();
    if (result) return result.timeoutPenalty;
  }

  return 5000; // Default fallback (5000 km)
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");
    const userId = searchParams.get("userId"); // Optional: view another player's guesses
    const roundNumber = searchParams.get("roundNumber"); // Optional: filter by round

    if (!gameId) {
      return NextResponse.json(
        { error: "Game ID is required" },
        { status: 400 }
      );
    }

    // Determine which user's guesses to fetch
    const targetUserId = userId || session.user.id;
    const isOwnGuesses = targetUserId === session.user.id;

    // Get the game to check permissions
    const game = await db
      .select({
        id: games.id,
        groupId: games.groupId,
        leaderboardRevealed: games.leaderboardRevealed,
        status: games.status,
      })
      .from(games)
      .where(eq(games.id, gameId))
      .get();

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // If viewing another user's guesses, check if allowed
    if (!isOwnGuesses) {
      // Must be revealed or game completed to view other players' guesses
      const isRevealed = game.leaderboardRevealed || game.status === "completed";
      if (!isRevealed) {
        return NextResponse.json(
          { error: "Leaderboard not revealed yet" },
          { status: 403 }
        );
      }

      // Must be member of the same group
      if (game.groupId) {
        const membership = await db
          .select()
          .from(groupMembers)
          .where(
            and(
              eq(groupMembers.groupId, game.groupId),
              eq(groupMembers.userId, session.user.id)
            )
          )
          .get();

        if (!membership) {
          return NextResponse.json({ error: "Not a member" }, { status: 403 });
        }
      }
    }

    // Build WHERE conditions
    let whereConditions = and(
      eq(gameRounds.gameId, gameId),
      eq(guesses.userId, targetUserId)
    );

    if (roundNumber) {
      whereConditions = and(
        whereConditions,
        sql`${gameRounds.roundNumber} = ${parseInt(roundNumber)}`
      );
    }

    // Get guesses with location details
    const userGuessesRaw = await db
      .select({
        id: guesses.id,
        gameRoundId: guesses.gameRoundId,
        latitude: guesses.latitude,
        longitude: guesses.longitude,
        distanceKm: guesses.distanceKm,
        timeSeconds: guesses.timeSeconds,
        roundNumber: gameRounds.roundNumber,
        locationIndex: gameRounds.locationIndex,
        gameType: gameRounds.gameType,
        country: gameRounds.country,
        locationId: gameRounds.locationId,
        locationSource: gameRounds.locationSource,
      })
      .from(guesses)
      .innerJoin(gameRounds, eq(guesses.gameRoundId, gameRounds.id))
      .where(whereConditions);

    // Fetch location details for each guess
    const guessesWithLocations = await Promise.all(
      userGuessesRaw.map(async (guess) => {
        let locationData: { name: string; latitude: number; longitude: number; countryCode?: string | null } | null = null;

        // Fallback for old rounds without gameType
        const effectiveGameType = guess.gameType || `country:${guess.country || 'switzerland'}`;

        if (guess.locationSource === "worldLocations") {
          const loc = await db
            .select({ name: worldLocations.name, latitude: worldLocations.latitude, longitude: worldLocations.longitude, countryCode: worldLocations.countryCode })
            .from(worldLocations)
            .where(eq(worldLocations.id, guess.locationId))
            .get();
          locationData = loc || null;
        } else if (guess.locationSource === "panoramaLocations") {
          // Panorama locations (Mapillary Street View style)
          const loc = await db
            .select({ name: panoramaLocations.name, latitude: panoramaLocations.latitude, longitude: panoramaLocations.longitude })
            .from(panoramaLocations)
            .where(eq(panoramaLocations.id, guess.locationId))
            .get();
          locationData = loc || null;
        } else if (guess.locationSource === "imageLocations" || isImageGameType(effectiveGameType)) {
          // Image-based locations use x/y pixel coordinates
          const loc = await db
            .select({ name: imageLocations.name, x: imageLocations.x, y: imageLocations.y })
            .from(imageLocations)
            .where(eq(imageLocations.id, guess.locationId))
            .get();
          if (loc) {
            // For ImageMap, lat=y and lng=x (Leaflet CRS.Simple convention)
            locationData = { name: loc.name, latitude: loc.y, longitude: loc.x };
          }
        } else {
          const loc = await db
            .select({ name: locations.name, latitude: locations.latitude, longitude: locations.longitude })
            .from(locations)
            .where(eq(locations.id, guess.locationId))
            .get();
          locationData = loc || null;
        }

        // Get scoreScaleFactor from DB for dynamic game types
        const dbScoreScaleFactor = await getScoreScaleFactorFromDB(effectiveGameType);

        // Calculate score - use V3 for special quizzes only (country hit detection)
        let score: number;
        let isCorrectCountry: boolean | undefined;

        if (isSpecialQuizGameType(effectiveGameType) && guess.latitude !== null && guess.longitude !== null && locationData?.countryCode) {
          // Special quiz: V3 scoring with country hit bonus
          isCorrectCountry = await isPointInCountryPolygon(guess.latitude, guess.longitude, locationData.countryCode);
          score = calculateScore(
            {
              distanceKm: guess.distanceKm,
              timeSeconds: guess.timeSeconds,
              gameType: effectiveGameType,
              scoreScaleFactor: dbScoreScaleFactor,
              isCorrectCountry,
            },
            3 // V3 scoring for special quizzes
          );
        } else {
          // Country and World quizzes: V2 time-based scoring
          score = calculateScore(
            {
              distanceKm: guess.distanceKm,
              timeSeconds: guess.timeSeconds,
              gameType: effectiveGameType,
              scoreScaleFactor: dbScoreScaleFactor,
            },
            2 // V2 time-based scoring
          );
        }

        return {
          id: guess.id,
          gameRoundId: guess.gameRoundId,
          latitude: guess.latitude,
          longitude: guess.longitude,
          distanceKm: guess.distanceKm,
          score,
          roundNumber: guess.roundNumber,
          locationIndex: guess.locationIndex,
          targetLatitude: locationData?.latitude || 0,
          targetLongitude: locationData?.longitude || 0,
          locationName: locationData?.name || "Unknown",
          gameType: effectiveGameType,
          ...(isSpecialQuizGameType(effectiveGameType) && { insideCountry: isCorrectCountry }),
        };
      })
    );

    // Sort by roundNumber, then locationIndex
    guessesWithLocations.sort((a, b) => {
      if (a.roundNumber !== b.roundNumber) return a.roundNumber - b.roundNumber;
      return a.locationIndex - b.locationIndex;
    });

    return NextResponse.json({ guesses: guessesWithLocations });
  } catch (error) {
    logger.error("Error fetching guesses", error);
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
        locationIndex: gameRounds.locationIndex,
        locationSource: gameRounds.locationSource,
        roundNumber: gameRounds.roundNumber,
        gameType: gameRounds.gameType,
        timeLimitSeconds: gameRounds.timeLimitSeconds,
        groupId: games.groupId,
        userId: games.userId,
        mode: games.mode,
        currentRound: games.currentRound,
        country: games.country,
        gameTimeLimitSeconds: games.timeLimitSeconds,
        activeLocationIndex: games.activeLocationIndex,
        locationStartedAt: games.locationStartedAt,
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

    // Authorization check based on game mode
    if (round.mode === "group") {
      // Group games: check group membership
      if (!round.groupId) {
        return NextResponse.json({ error: "Invalid game state" }, { status: 400 });
      }
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
    } else {
      // Solo/Training games: check if user owns the game
      if (round.userId !== session.user.id) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }
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

    // Anti-cheat: Server-side timer validation for ranked games
    // Only validate if locationStartedAt is set (new security feature)
    if (round.locationStartedAt && !timeout) {
      const effectiveGameTypeForConfig = round.gameType || `country:${round.country}`;
      // Default time limits: 30s for regular games, 60s for panorama
      const isPanorama = effectiveGameTypeForConfig.startsWith("panorama:");
      const defaultTimeLimit = isPanorama ? 60 : 30;
      const timeLimitSeconds = round.timeLimitSeconds ?? round.gameTimeLimitSeconds ?? defaultTimeLimit;
      const timeLimitMs = timeLimitSeconds * 1000;

      const elapsedMs = Date.now() - round.locationStartedAt;

      // Add 2 second grace period for network latency
      const gracePeriodMs = 2000;

      if (elapsedMs > timeLimitMs + gracePeriodMs) {
        // Time expired - treat as timeout
        logger.info("Server-side timeout detected", {
          gameId: round.gameId,
          locationIndex: round.locationIndex,
          elapsedMs,
          timeLimitMs,
        });

        return NextResponse.json(
          {
            error: "Time expired",
            timeExpired: true,
            elapsedSeconds: Math.floor(elapsedMs / 1000),
            timeLimitSeconds,
          },
          { status: 410 }
        );
      }
    }

    // Get location coordinates - query correct table based on locationSource
    const effectiveGameType = round.gameType || `country:${round.country}`;
    const isImage = isImageGameType(effectiveGameType);
    const isCountryQuiz = isCountryQuizGameType(effectiveGameType);

    let location: { latitude: number; longitude: number; countryCode?: string | null } | undefined;

    if (round.locationSource === "worldLocations") {
      const worldLoc = await db
        .select({
          latitude: worldLocations.latitude,
          longitude: worldLocations.longitude,
          countryCode: worldLocations.countryCode,
        })
        .from(worldLocations)
        .where(eq(worldLocations.id, round.locationId))
        .get();
      location = worldLoc;
    } else if (round.locationSource === "panoramaLocations") {
      // Panorama locations (Mapillary Street View style)
      const panoramaLoc = await db
        .select({
          latitude: panoramaLocations.latitude,
          longitude: panoramaLocations.longitude,
          countryCode: panoramaLocations.countryCode,
        })
        .from(panoramaLocations)
        .where(eq(panoramaLocations.id, round.locationId))
        .get();
      location = panoramaLoc;
    } else if (round.locationSource === "imageLocations" || isImage) {
      // Image-based locations use x/y pixel coordinates
      const imageLoc = await db
        .select({ x: imageLocations.x, y: imageLocations.y })
        .from(imageLocations)
        .where(eq(imageLocations.id, round.locationId))
        .get();
      if (imageLoc) {
        // For ImageMap, lat=y and lng=x (Leaflet CRS.Simple convention)
        location = { latitude: imageLoc.y, longitude: imageLoc.x };
      }
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

    // Calculate distance
    let distanceKm: number;
    let insideCountry = false;

    if (timeout) {
      // Get timeout penalty from DB (supports dynamic game types)
      distanceKm = await getTimeoutPenaltyFromDB(effectiveGameType);
    } else if (isImage) {
      // For image maps: use pixel distance (92px = 10m)
      distanceKm = calculatePixelDistance(
        longitude, // x = lng
        latitude,  // y = lat
        location.longitude,
        location.latitude
      );
    } else if (isCountryQuiz && location.countryCode) {
      // For country quizzes: check if click is inside the correct country polygon
      insideCountry = isPointInCountry(latitude, longitude, location.countryCode);

      if (insideCountry) {
        // Perfect! Clicked inside the correct country
        distanceKm = 0;
      } else {
        // Outside: calculate distance to country center as fallback
        distanceKm = calculateDistance(
          latitude,
          longitude,
          location.latitude,
          location.longitude
        );
      }
    } else {
      // For geo maps: use Haversine formula
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

    // Anti-cheat: Clear locationStartedAt after guess is submitted
    // This prevents replay attacks and prepares for next location
    if (round.locationStartedAt) {
      await db
        .update(games)
        .set({
          locationStartedAt: null,
          // Note: We don't increment activeLocationIndex here
          // The client calls start-location to begin the next round
        })
        .where(eq(games.id, round.gameId));
    }

    // Calculate score based on game type (get scoreScaleFactor from DB for dynamic types)
    const dbScoreScaleFactor = await getScoreScaleFactorFromDB(effectiveGameType);

    // Determine scoring version and check country hit for special quizzes
    let score: number;
    let isCorrectCountry: boolean | undefined;

    if (isSpecialQuizGameType(effectiveGameType) && !timeout && latitude !== null && longitude !== null) {
      // Special quiz: V3 scoring with country hit bonus
      if (location.countryCode) {
        isCorrectCountry = await isPointInCountryPolygon(latitude, longitude, location.countryCode);
      }
      score = calculateScore(
        {
          distanceKm,
          timeSeconds: timeSeconds || null,
          gameType: effectiveGameType,
          scoreScaleFactor: dbScoreScaleFactor,
          isCorrectCountry,
        },
        3 // V3 scoring for special quizzes
      );
    } else {
      // Country/World/Panorama quizzes: V2 time-based scoring
      score = calculateScore(
        {
          distanceKm,
          timeSeconds: timeSeconds || null,
          gameType: effectiveGameType,
          scoreScaleFactor: dbScoreScaleFactor,
        },
        2 // V2 time-based scoring
      );
    }

    return NextResponse.json({
      id: guessId,
      distanceKm,
      score,
      gameType: effectiveGameType,
      targetLatitude: location.latitude,
      targetLongitude: location.longitude,
      // For country quizzes and special quizzes: indicate if click was inside the correct country
      ...((isCountryQuiz || isSpecialQuizGameType(effectiveGameType)) && {
        insideCountry: isCountryQuiz ? insideCountry : isCorrectCountry,
        targetCountryCode: location.countryCode,
      }),
    });
  } catch (error) {
    logger.error("Error creating guess", error);
    return NextResponse.json(
      { error: "Failed to create guess" },
      { status: 500 }
    );
  }
}
