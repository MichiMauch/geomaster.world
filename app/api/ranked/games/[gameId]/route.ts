import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { games, gameRounds, locations, worldLocations, countries, worldQuizTypes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getLocalizedName } from "@/lib/location-utils";
import { GAME_TYPES, isWorldGameType, getWorldCategory } from "@/lib/game-types";

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

    // Fetch location names from respective tables
    const countryLocationsMap = new Map();
    const worldLocationsMap = new Map();

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

    // Combine rounds with location info
    const rounds = allRounds.map(round => {
      const locationMap = round.locationSource === "worldLocations"
        ? worldLocationsMap
        : countryLocationsMap;
      const locationInfo = locationMap.get(round.locationId);

      return {
        id: round.id,
        roundNumber: round.roundNumber,
        locationIndex: round.locationIndex,
        locationId: round.locationId,
        locationName: locationInfo ? getLocalizedName(locationInfo, locale) : "Unknown",
        latitude: locationInfo?.latitude ?? 0,
        longitude: locationInfo?.longitude ?? 0,
        country: round.country,
        gameType: round.gameType,
        timeLimitSeconds: round.timeLimitSeconds,
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
    console.error("Error fetching ranked game:", error);
    return NextResponse.json(
      { error: "Failed to fetch game" },
      { status: 500 }
    );
  }
}
