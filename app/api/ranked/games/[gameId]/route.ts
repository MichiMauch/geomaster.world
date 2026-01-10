import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { games, gameRounds, guesses, locations, worldLocations, panoramaLocations, countries, worldQuizTypes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getLocalizedName } from "@/lib/location-utils";
import { GAME_TYPES, isWorldGameType, getWorldCategory, isPanoramaGameType } from "@/lib/game-types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") || "de";

  try {
    const { gameId } = await params;

    // Fetch game
    const game = await db
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .get();

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Fetch all game rounds
    const allRounds = await db
      .select()
      .from(gameRounds)
      .where(eq(gameRounds.gameId, gameId))
      .orderBy(gameRounds.roundNumber, gameRounds.locationIndex);

    // Separate rounds by locationSource
    const countryRoundIds = allRounds.filter(r => r.locationSource === "locations").map(r => r.locationId);
    const worldRoundIds = allRounds.filter(r => r.locationSource === "worldLocations").map(r => r.locationId);
    const panoramaRoundIds = allRounds.filter(r => r.locationSource === "panoramaLocations").map(r => r.locationId);

    // Fetch location names from respective tables
    const countryLocationsMap = new Map();
    const worldLocationsMap = new Map();
    const panoramaLocationsMap = new Map();

    if (countryRoundIds.length > 0) {
      const countryLocs = await db.select().from(locations);
      countryLocs.forEach(loc => {
        countryLocationsMap.set(loc.id, {
          name: loc.name,
          nameDe: loc.nameDe,
          nameEn: loc.nameEn,
          nameSl: loc.nameSl,
          latitude: loc.latitude,
          longitude: loc.longitude,
        });
      });
    }

    if (worldRoundIds.length > 0) {
      const worldLocs = await db.select().from(worldLocations);
      worldLocs.forEach(loc => {
        worldLocationsMap.set(loc.id, {
          name: loc.name,
          nameDe: loc.nameDe,
          nameEn: loc.nameEn,
          nameSl: loc.nameSl,
          latitude: loc.latitude,
          longitude: loc.longitude,
        });
      });
    }

    if (panoramaRoundIds.length > 0) {
      const panoramaLocs = await db.select().from(panoramaLocations);
      panoramaLocs.forEach(loc => {
        panoramaLocationsMap.set(loc.id, {
          name: loc.name,
          nameDe: loc.nameDe,
          nameEn: loc.nameEn,
          nameSl: loc.nameSl,
          latitude: loc.latitude,
          longitude: loc.longitude,
          mapillaryImageKey: loc.mapillaryImageKey,
          heading: loc.heading,
          pitch: loc.pitch,
        });
      });
    }

    // For authenticated users: fetch existing guesses to determine which rounds are completed
    const completedRoundIds = new Set<string>();
    if (session?.user?.id) {
      const userGuesses = await db
        .select()
        .from(guesses)
        .where(eq(guesses.userId, session.user.id));

      const gameRoundIds = new Set(allRounds.map(r => r.id));
      userGuesses.forEach(g => {
        if (gameRoundIds.has(g.gameRoundId)) {
          completedRoundIds.add(g.gameRoundId);
        }
      });
    }

    // For guests: send all coordinates (no ranking impact, client-side game)
    const isGuest = !session?.user?.id;

    // Combine rounds with location info
    const rounds = allRounds.map(round => {
      const locationMap = round.locationSource === "panoramaLocations"
        ? panoramaLocationsMap
        : round.locationSource === "worldLocations"
          ? worldLocationsMap
          : countryLocationsMap;
      const locationInfo = locationMap.get(round.locationId);

      // For Country-Quiz (flags or place names): use name directly (flag emoji or place name)
      // For others: use localized name
      const isCountryQuiz = round.gameType?.startsWith("world:") &&
        ["country-flags", "place-names"].includes(round.gameType.split(":")[1]);

      // For panorama games, we don't show the location name during gameplay (GeoGuessr experience)
      const isPanorama = isPanoramaGameType(round.gameType);
      const locationName = isPanorama
        ? "" // Don't show name for panorama (pure GeoGuessr experience)
        : isCountryQuiz
          ? locationInfo?.name ?? "Unknown"
          : locationInfo ? getLocalizedName(locationInfo, locale) : "Unknown";

      // Anti-cheat: Only send coordinates for completed rounds or guests
      // Active round coordinates are obtained via start-location API
      const isCompleted = completedRoundIds.has(round.id);
      const shouldRevealCoordinates = isGuest || isCompleted;

      return {
        id: round.id,
        roundNumber: round.roundNumber,
        locationIndex: round.locationIndex,
        locationId: round.locationId,
        locationName,
        // Only reveal coordinates for completed rounds (or guests)
        latitude: shouldRevealCoordinates ? (locationInfo?.latitude ?? 0) : null,
        longitude: shouldRevealCoordinates ? (locationInfo?.longitude ?? 0) : null,
        country: round.country,
        gameType: round.gameType,
        timeLimitSeconds: round.timeLimitSeconds,
        // Panorama-specific fields - only for guests (active round gets these from start-location)
        mapillaryImageKey: isGuest ? (locationInfo?.mapillaryImageKey ?? null) : null,
        heading: isGuest ? (locationInfo?.heading ?? null) : null,
        pitch: isGuest ? (locationInfo?.pitch ?? null) : null,
        // Status for client-side logic
        status: isCompleted ? "completed" : "pending",
      };
    });

    // Check if this is a dynamic country (not in static GAME_TYPES)
    let dynamicCountry = null;
    if (game.gameType?.startsWith("country:") && !GAME_TYPES[game.gameType]) {
      const countryId = game.gameType.split(":")[1];
      const countryResult = await db
        .select()
        .from(countries)
        .where(eq(countries.id, countryId));

      if (countryResult.length > 0) {
        dynamicCountry = countryResult[0];
      }
    }

    // Check if this is a world quiz type (always dynamic now - loaded from DB)
    let dynamicWorldQuiz = null;
    if (isWorldGameType(game.gameType)) {
      const category = getWorldCategory(game.gameType!);
      if (category) {
        const worldQuizResult = await db
          .select()
          .from(worldQuizTypes)
          .where(eq(worldQuizTypes.id, category));

        if (worldQuizResult.length > 0) {
          dynamicWorldQuiz = worldQuizResult[0];
        }
      }
    }

    return NextResponse.json({
      game,
      rounds,
      dynamicCountry,
      dynamicWorldQuiz,
    });
  } catch (error) {
    logger.error("Error fetching ranked game", error);
    return NextResponse.json(
      { error: "Failed to fetch game" },
      { status: 500 }
    );
  }
}
