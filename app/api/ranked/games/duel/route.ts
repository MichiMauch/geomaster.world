import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { activityLogger } from "@/lib/activity-logger";
import { games, gameRounds, locations, worldLocations, panoramaLocations, countries, worldQuizTypes, panoramaTypes, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { getGameTypeConfig, isWorldGameType, getWorldCategory, isPanoramaGameType, getPanoramaCategory, GAME_TYPES, type GameTypeConfig } from "@/lib/game-types";
import { getLocationCountryName } from "@/lib/countries";
import { getCurrentScoringVersion } from "@/lib/scoring";
import { countryToGameTypeConfig, worldQuizToGameTypeConfig, panoramaToGameTypeConfig, type DatabaseCountry, type DatabaseWorldQuizType, type DatabasePanoramaType } from "@/lib/utils/country-converter";
import { seededShuffle } from "@/lib/utils";
import { generateDuelSeed, decodeDuelChallenge, type DuelChallenge } from "@/lib/duel-utils";
import { getDisplayName } from "@/lib/utils";

/**
 * POST /api/ranked/games/duel
 * Create a new duel game (either as challenger or accepter)
 *
 * Body for challenger (starting new duel):
 *   { gameType: string }
 *
 * Body for accepter (accepting challenge):
 *   { gameType: string, challenge: string (base64 encoded) }
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  // Duel mode requires authentication
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required for duel mode" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { gameType, challenge } = body;

    // Validate gameType - check static GAME_TYPES first
    let config: GameTypeConfig | null = GAME_TYPES[gameType] || null;
    let dbCountry: DatabaseCountry | null = null;
    let dbWorldQuiz: DatabaseWorldQuizType | null = null;

    // If not in static GAME_TYPES, check for dynamic country in database
    if (!config && gameType?.startsWith("country:")) {
      const countryId = gameType.split(":")[1];
      const countryResult = await db
        .select()
        .from(countries)
        .where(eq(countries.id, countryId));

      if (countryResult.length > 0 && countryResult[0].isActive) {
        dbCountry = countryResult[0] as DatabaseCountry;
        config = countryToGameTypeConfig(dbCountry);
      }
    }

    // If not in static GAME_TYPES, check for dynamic world quiz type in database
    if (!config && gameType?.startsWith("world:")) {
      const category = getWorldCategory(gameType);
      if (category) {
        const worldQuizResult = await db
          .select()
          .from(worldQuizTypes)
          .where(eq(worldQuizTypes.id, category));

        if (worldQuizResult.length > 0 && worldQuizResult[0].isActive) {
          dbWorldQuiz = worldQuizResult[0] as DatabaseWorldQuizType;
          config = worldQuizToGameTypeConfig(dbWorldQuiz);
        }
      }
    }

    // If not in static GAME_TYPES, check for dynamic panorama type in database
    if (!config && gameType?.startsWith("panorama:")) {
      const category = getPanoramaCategory(gameType);
      if (category) {
        const panoramaResult = await db
          .select()
          .from(panoramaTypes)
          .where(eq(panoramaTypes.id, category));

        if (panoramaResult.length > 0 && panoramaResult[0].isActive) {
          config = panoramaToGameTypeConfig(panoramaResult[0] as DatabasePanoramaType);
        }
      }
    }

    if (!gameType || !config) {
      return NextResponse.json(
        { error: "Invalid game type" },
        { status: 400 }
      );
    }

    // Exclude image game types from duel
    if (gameType.startsWith("image:")) {
      return NextResponse.json(
        { error: "Image game types are not supported in duel mode" },
        { status: 400 }
      );
    }

    // Decode challenge if provided (accepter flow)
    let challengeData: DuelChallenge | null = null;
    if (challenge) {
      challengeData = decodeDuelChallenge(challenge);
      if (!challengeData) {
        return NextResponse.json(
          { error: "Invalid challenge data" },
          { status: 400 }
        );
      }

      // Verify game type matches
      if (challengeData.gameType !== gameType) {
        return NextResponse.json(
          { error: "Game type mismatch" },
          { status: 400 }
        );
      }

      // Prevent self-challenge
      if (challengeData.challengerId === session.user.id) {
        return NextResponse.json(
          { error: "Cannot accept your own challenge" },
          { status: 400 }
        );
      }
    }

    // Duel games have fixed settings: 5 locations, 30 seconds per location (60 for panorama)
    const locationsPerRound = 5;
    const timeLimitSeconds = isPanoramaGameType(gameType) ? config.defaultTimeLimitSeconds ?? 60 : 30;

    // Get seed: from challenge (accepter) or generate new (challenger)
    const duelSeed = challengeData?.seed || generateDuelSeed();

    // Fetch available locations based on game type
    let availableLocations: Array<{ id: string; name: string; latitude: number; longitude: number; mapillaryImageKey?: string; heading?: number | null; pitch?: number | null }> = [];

    if (isPanoramaGameType(gameType)) {
      const panoramaLocs = await db
        .select()
        .from(panoramaLocations);

      availableLocations = panoramaLocs.map((loc) => ({
        id: loc.id,
        name: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
        mapillaryImageKey: loc.mapillaryImageKey,
        heading: loc.heading,
        pitch: loc.pitch,
      }));
    } else if (isWorldGameType(gameType)) {
      const category = getWorldCategory(gameType);
      if (!category) {
        return NextResponse.json(
          { error: "Invalid world game type" },
          { status: 400 }
        );
      }

      const worldLocs = await db
        .select()
        .from(worldLocations)
        .where(eq(worldLocations.category, category));

      availableLocations = worldLocs.map((loc) => ({
        id: loc.id,
        name: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
      }));
    } else {
      const countryKey = gameType.split(":")[1];
      const countryName = dbCountry
        ? (dbCountry.nameEn || dbCountry.name)
        : getLocationCountryName(countryKey);

      const countryLocs = await db
        .select()
        .from(locations)
        .where(eq(locations.country, countryName));

      availableLocations = countryLocs.map((loc) => ({
        id: loc.id,
        name: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
      }));
    }

    // Check if we have enough locations
    if (availableLocations.length < locationsPerRound) {
      return NextResponse.json(
        { error: `Not enough locations available. Need ${locationsPerRound}, found ${availableLocations.length}` },
        { status: 400 }
      );
    }

    // Use seededShuffle for deterministic selection (same seed = same locations)
    const shuffled = seededShuffle(availableLocations, duelSeed);
    const selectedLocations = shuffled.slice(0, locationsPerRound);

    // Create game
    const gameId = nanoid();
    const now = new Date();

    // Get user display name for response
    const currentUser = await db.select().from(users).where(eq(users.id, session.user.id)).get();
    const displayName = currentUser ? getDisplayName(currentUser.name, currentUser.nickname) : "Anonym";

    await db.insert(games).values({
      id: gameId,
      groupId: null,
      userId: session.user.id,
      mode: "duel",
      name: `Duell: ${config.name.de}`,
      country: "switzerland",
      gameType,
      locationsPerRound,
      timeLimitSeconds,
      scoringVersion: getCurrentScoringVersion(),
      status: "active",
      currentRound: 1,
      duelSeed,
      createdAt: now,
    });

    // Create game rounds
    for (let i = 0; i < selectedLocations.length; i++) {
      const location = selectedLocations[i];
      await db.insert(gameRounds).values({
        id: nanoid(),
        gameId,
        roundNumber: 1,
        locationIndex: i + 1,
        locationId: location.id,
        locationSource: isPanoramaGameType(gameType) ? "panoramaLocations" : isWorldGameType(gameType) ? "worldLocations" : "locations",
        country: "switzerland",
        gameType,
        timeLimitSeconds,
      });
    }

    // Log game started
    activityLogger.logGame("started", session.user.id, gameId, { gameType, mode: "duel" }).catch(() => {});

    // Return different data based on challenger vs accepter
    const response: {
      gameId: string;
      gameType: string;
      duelSeed: string;
      locationsPerRound: number;
      timeLimitSeconds: number;
      userId: string;
      userName: string;
      isAccepter: boolean;
      challengeData?: DuelChallenge;
    } = {
      gameId,
      gameType,
      duelSeed,
      locationsPerRound,
      timeLimitSeconds,
      userId: session.user.id,
      userName: displayName,
      isAccepter: !!challengeData,
    };

    if (challengeData) {
      response.challengeData = challengeData;
    }

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error creating duel game", error);
    return NextResponse.json(
      { error: "Failed to create duel game" },
      { status: 500 }
    );
  }
}
