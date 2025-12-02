import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  games,
  gameRounds,
  guesses,
  locations,
  worldLocations,
  users,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { getGameTypeIds, isWorldGameType, getWorldCategory, DEFAULT_GAME_TYPE } from "@/lib/game-types";
import { getLocalizedName, LocalizedLocation } from "@/lib/location-utils";
import { getLocationCountryName } from "@/lib/countries";

// GET: List user's solo games
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") ||
      request.headers.get("Accept-Language")?.split(",")[0]?.split("-")[0] ||
      "de";

    // Get user's solo games
    const soloGames = await db
      .select()
      .from(games)
      .where(
        and(
          eq(games.userId, session.user.id),
          eq(games.mode, "solo")
        )
      )
      .orderBy(desc(games.createdAt));

    // Get current active solo game (if any)
    const activeGame = soloGames.find(g => g.status === "active");

    // If there's an active game, get its rounds with location info
    let rounds: Array<{
      id: string;
      roundNumber: number;
      locationIndex: number;
      locationId: string;
      locationName: string;
      latitude: number;
      longitude: number;
      country: string;
      gameType: string | null;
    }> = [];

    if (activeGame) {
      const allRounds = await db
        .select()
        .from(gameRounds)
        .where(eq(gameRounds.gameId, activeGame.id))
        .orderBy(gameRounds.roundNumber, gameRounds.locationIndex);

      // Fetch location names
      const countryLocationsMap = new Map<string, LocalizedLocation & { latitude: number; longitude: number }>();
      const worldLocationsMap = new Map<string, LocalizedLocation & { latitude: number; longitude: number }>();

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

      rounds = allRounds.map(round => {
        const locationMap = round.locationSource === "worldLocations" ? worldLocationsMap : countryLocationsMap;
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
        };
      });
    }

    // Get completed games with total scores
    const completedGames = await Promise.all(
      soloGames
        .filter(g => g.status === "completed")
        .slice(0, 10) // Last 10 completed games
        .map(async (game) => {
          // Get all guesses for this game
          const gameGuesses = await db
            .select({ distanceKm: guesses.distanceKm })
            .from(guesses)
            .innerJoin(gameRounds, eq(guesses.gameRoundId, gameRounds.id))
            .where(
              and(
                eq(gameRounds.gameId, game.id),
                eq(guesses.userId, session.user.id)
              )
            );

          const totalDistance = gameGuesses.reduce((sum, g) => sum + g.distanceKm, 0);
          const roundsPlayed = gameGuesses.length;

          return {
            ...game,
            totalDistance,
            roundsPlayed,
            averageDistance: roundsPlayed > 0 ? totalDistance / roundsPlayed : 0,
          };
        })
    );

    // Get user's hintEnabled setting
    const user = await db
      .select({ hintEnabled: users.hintEnabled })
      .from(users)
      .where(eq(users.id, session.user.id))
      .get();

    return NextResponse.json({
      activeGame,
      rounds,
      completedGames,
      hintEnabled: user?.hintEnabled ?? false,
    });
  } catch (error) {
    console.error("Error fetching solo games:", error);
    return NextResponse.json(
      { error: "Failed to fetch solo games" },
      { status: 500 }
    );
  }
}

// POST: Create a new solo game with auto-released first round
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      gameType = DEFAULT_GAME_TYPE,
      locationsPerRound = 5,
      timeLimitSeconds,
      totalRounds = 1, // How many rounds to create upfront
    } = body;

    // Validate gameType
    const validGameTypes = getGameTypeIds();
    if (!validGameTypes.includes(gameType)) {
      return NextResponse.json(
        { error: "Invalid game type" },
        { status: 400 }
      );
    }

    // Check if user already has an active solo game
    const existingActiveGame = await db
      .select()
      .from(games)
      .where(
        and(
          eq(games.userId, session.user.id),
          eq(games.mode, "solo"),
          eq(games.status, "active")
        )
      )
      .get();

    if (existingActiveGame) {
      return NextResponse.json(
        { error: "Du hast bereits ein aktives Solo-Spiel. Beende es zuerst oder lösche es." },
        { status: 400 }
      );
    }

    // Get available locations based on game type
    const isWorld = isWorldGameType(gameType);
    let availableLocations: Array<{ id: string; name: string; latitude: number; longitude: number }> = [];
    let locationSource: "locations" | "worldLocations" = "locations";
    let roundCountry: string;

    if (isWorld) {
      const category = getWorldCategory(gameType);
      if (category) {
        const worldLocs = await db
          .select()
          .from(worldLocations)
          .where(eq(worldLocations.category, category));

        availableLocations = worldLocs.map(loc => ({
          id: loc.id,
          name: loc.name,
          latitude: loc.latitude,
          longitude: loc.longitude,
        }));
      }
      roundCountry = "world";
      locationSource = "worldLocations";
    } else {
      const country = gameType.replace("country:", "");
      const countryName = getLocationCountryName(country);
      const countryLocs = await db
        .select()
        .from(locations)
        .where(eq(locations.country, countryName));

      availableLocations = countryLocs.map(loc => ({
        id: loc.id,
        name: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
      }));
      roundCountry = country;
    }

    // Check if we have enough locations
    const totalLocationsNeeded = locationsPerRound * totalRounds;
    if (availableLocations.length < totalLocationsNeeded) {
      return NextResponse.json(
        {
          error: `Nicht genügend Orte verfügbar. Benötigt: ${totalLocationsNeeded}, Verfügbar: ${availableLocations.length}`,
        },
        { status: 400 }
      );
    }

    // Create the game
    const now = new Date();
    const gameId = nanoid();
    await db.insert(games).values({
      id: gameId,
      groupId: null, // Solo games don't belong to a group
      userId: session.user.id,
      mode: "solo",
      name: null,
      country: roundCountry === "world" ? "world" : roundCountry,
      gameType,
      locationsPerRound,
      timeLimitSeconds: timeLimitSeconds || null,
      status: "active",
      currentRound: totalRounds, // All rounds are immediately released
      createdAt: now,
    });

    // Create all rounds upfront (shuffled locations)
    const shuffled = [...availableLocations].sort(() => Math.random() - 0.5);
    const gameRoundsToInsert = [];

    for (let round = 1; round <= totalRounds; round++) {
      for (let i = 0; i < locationsPerRound; i++) {
        const locIndex = (round - 1) * locationsPerRound + i;
        gameRoundsToInsert.push({
          id: nanoid(),
          gameId,
          roundNumber: round,
          locationIndex: i + 1,
          locationId: shuffled[locIndex].id,
          locationSource,
          country: roundCountry,
          gameType,
        });
      }
    }

    await db.insert(gameRounds).values(gameRoundsToInsert);

    return NextResponse.json({
      gameId,
      gameType,
      locationsPerRound,
      totalRounds,
    });
  } catch (error) {
    console.error("Error creating solo game:", error);
    return NextResponse.json(
      { error: "Failed to create solo game" },
      { status: 500 }
    );
  }
}
