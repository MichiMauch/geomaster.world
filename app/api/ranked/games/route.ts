import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { activityLogger } from "@/lib/activity-logger";
import { games, gameRounds, locations, worldLocations, panoramaLocations, countries, worldQuizTypes, panoramaTypes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { getGameTypeConfig, isWorldGameType, getWorldCategory, isPanoramaGameType, getPanoramaCategory, GAME_TYPES, type GameTypeConfig } from "@/lib/game-types";
import { getLocationCountryName } from "@/lib/countries";
import { getCurrentScoringVersion } from "@/lib/scoring";
import { countryToGameTypeConfig, worldQuizToGameTypeConfig, panoramaToGameTypeConfig, type DatabaseCountry, type DatabaseWorldQuizType, type DatabasePanoramaType } from "@/lib/utils/country-converter";
import { shuffle } from "@/lib/utils";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  try {
    const body = await request.json();
    const { gameType, guestId } = body;

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

    // Exclude image game types from ranked
    if (gameType.startsWith("image:")) {
      return NextResponse.json(
        { error: "Image game types are not supported in ranked mode" },
        { status: 400 }
      );
    }

    // Ranked games have fixed settings: 5 locations, 30 seconds per location (60 for panorama)
    const locationsPerRound = 5;
    const timeLimitSeconds = isPanoramaGameType(gameType) ? config.defaultTimeLimitSeconds ?? 60 : 30;

    // Fetch available locations based on game type
    let availableLocations: Array<{ id: string; name: string; latitude: number; longitude: number; mapillaryImageKey?: string; heading?: number | null; pitch?: number | null }> = [];

    if (isPanoramaGameType(gameType)) {
      // Panorama game type - fetch from panoramaLocations
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
      // Country game type - extract country from gameType
      const countryKey = gameType.split(":")[1]; // e.g., "country:switzerland" → "switzerland"

      // Use DB country name if available, otherwise fall back to static lookup
      const countryName = dbCountry
        ? (dbCountry.nameEn || dbCountry.name) // Use English name from DB (matches locations.country)
        : getLocationCountryName(countryKey); // "switzerland" → "Switzerland"

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

    // Randomly select locations using Fisher-Yates shuffle for unbiased selection
    const shuffled = shuffle(availableLocations);
    const selectedLocations = shuffled.slice(0, locationsPerRound);

    // Create game
    const gameId = nanoid();
    const now = new Date();

    await db.insert(games).values({
      id: gameId,
      groupId: null, // Ranked games have no group
      userId: session?.user?.id || null, // Can be null for guests
      mode: "ranked",
      name: `Ranked: ${config.name.de}`,
      country: "switzerland", // Legacy field
      gameType,
      locationsPerRound,
      timeLimitSeconds,
      scoringVersion: getCurrentScoringVersion(), // Use current scoring version (v2 = time-based)
      status: "active",
      currentRound: 1, // All locations are immediately available
      createdAt: now,
    });

    // Create game rounds (all 5 locations)
    for (let i = 0; i < selectedLocations.length; i++) {
      const location = selectedLocations[i];
      await db.insert(gameRounds).values({
        id: nanoid(),
        gameId,
        roundNumber: 1, // Single round with 5 locations
        locationIndex: i + 1,
        locationId: location.id,
        locationSource: isPanoramaGameType(gameType) ? "panoramaLocations" : isWorldGameType(gameType) ? "worldLocations" : "locations",
        country: "switzerland", // Legacy field
        gameType,
        timeLimitSeconds, // 30 seconds per location
      });
    }

    // Log game started (non-blocking)
    activityLogger.logGame("started", session?.user?.id, gameId, { gameType }).catch(() => {});

    return NextResponse.json({
      gameId,
      gameType,
      locationsPerRound,
      timeLimitSeconds,
      guestId: session?.user?.id ? null : guestId, // Return guestId if guest
    });
  } catch (error) {
    logger.error("Error creating ranked game", error);
    return NextResponse.json(
      { error: "Failed to create ranked game" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  try {
    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get("guestId");

    // Must be logged in OR provide guestId
    if (!session?.user?.id && !guestId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session?.user?.id;

    // Find active ranked games for this user
    const activeGames = await db
      .select()
      .from(games)
      .where(
        eq(games.mode, "ranked")
      )
      .orderBy(games.createdAt);

    // Filter by userId or guestId (we'd need to store guestId in games table for this to work properly)
    // For now, just filter by userId if logged in
    const userActiveGames = userId
      ? activeGames.filter((g) => g.userId === userId && g.status === "active")
      : [];

    return NextResponse.json({
      activeGames: userActiveGames,
    });
  } catch (error) {
    logger.error("Error fetching ranked games", error);
    return NextResponse.json(
      { error: "Failed to fetch ranked games" },
      { status: 500 }
    );
  }
}
