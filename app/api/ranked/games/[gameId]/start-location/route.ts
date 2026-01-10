import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { games, gameRounds, guesses, locations, worldLocations, panoramaLocations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { getLocalizedName } from "@/lib/location-utils";
import { isPanoramaGameType, getGameTypeConfig } from "@/lib/game-types";

/**
 * POST /api/ranked/games/[gameId]/start-location
 *
 * Starts a new location round for the game.
 * - Sets activeLocationIndex and locationStartedAt in the database
 * - Returns only the current location's coordinates
 * - Validates that the location hasn't already been guessed
 *
 * Anti-cheat: This is the ONLY way to get coordinates for a location.
 * The GET /api/ranked/games/[gameId] endpoint no longer returns coordinates
 * for unplayed locations.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") || "de";

  try {
    const { gameId } = await params;
    const body = await request.json();
    const requestedIndex = body.locationIndex as number;

    if (!requestedIndex || requestedIndex < 1 || requestedIndex > 5) {
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

    // For authenticated users, validate ownership
    if (session?.user?.id && game.userId && game.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if game is still active
    if (game.status === "completed") {
      return NextResponse.json(
        { error: "Game already completed" },
        { status: 400 }
      );
    }

    // Fetch all game rounds
    const allRounds = await db
      .select()
      .from(gameRounds)
      .where(eq(gameRounds.gameId, gameId))
      .orderBy(gameRounds.locationIndex);

    const targetRound = allRounds.find(r => r.locationIndex === requestedIndex);
    if (!targetRound) {
      return NextResponse.json(
        { error: "Round not found" },
        { status: 404 }
      );
    }

    // Check if this location was already guessed (for logged-in users)
    if (session?.user?.id) {
      const existingGuess = await db
        .select()
        .from(guesses)
        .where(
          and(
            eq(guesses.gameRoundId, targetRound.id),
            eq(guesses.userId, session.user.id)
          )
        )
        .get();

      if (existingGuess) {
        return NextResponse.json(
          { error: "Location already guessed", alreadyGuessed: true },
          { status: 400 }
        );
      }
    }

    // Validate that previous locations are completed (can't skip ahead)
    if (session?.user?.id && requestedIndex > 1) {
      for (let i = 1; i < requestedIndex; i++) {
        const prevRound = allRounds.find(r => r.locationIndex === i);
        if (prevRound) {
          const prevGuess = await db
            .select()
            .from(guesses)
            .where(
              and(
                eq(guesses.gameRoundId, prevRound.id),
                eq(guesses.userId, session.user.id)
              )
            )
            .get();

          if (!prevGuess) {
            return NextResponse.json(
              { error: `Must complete location ${i} first` },
              { status: 400 }
            );
          }
        }
      }
    }

    // Update game with new active location
    const now = Date.now();
    await db
      .update(games)
      .set({
        activeLocationIndex: requestedIndex,
        locationStartedAt: now,
      })
      .where(eq(games.id, gameId));

    // Fetch location details
    let locationInfo: {
      name: string;
      nameDe: string | null;
      nameEn: string | null;
      nameSl: string | null;
      latitude: number;
      longitude: number;
      mapillaryImageKey?: string | null;
      heading?: number | null;
      pitch?: number | null;
    } | null = null;

    if (targetRound.locationSource === "panoramaLocations") {
      const loc = await db
        .select()
        .from(panoramaLocations)
        .where(eq(panoramaLocations.id, targetRound.locationId))
        .get();
      if (loc) {
        locationInfo = {
          name: loc.name,
          nameDe: loc.nameDe,
          nameEn: loc.nameEn,
          nameSl: loc.nameSl,
          latitude: loc.latitude,
          longitude: loc.longitude,
          mapillaryImageKey: loc.mapillaryImageKey,
          heading: loc.heading,
          pitch: loc.pitch,
        };
      }
    } else if (targetRound.locationSource === "worldLocations") {
      const loc = await db
        .select()
        .from(worldLocations)
        .where(eq(worldLocations.id, targetRound.locationId))
        .get();
      if (loc) {
        locationInfo = {
          name: loc.name,
          nameDe: loc.nameDe,
          nameEn: loc.nameEn,
          nameSl: loc.nameSl,
          latitude: loc.latitude,
          longitude: loc.longitude,
        };
      }
    } else {
      const loc = await db
        .select()
        .from(locations)
        .where(eq(locations.id, targetRound.locationId))
        .get();
      if (loc) {
        locationInfo = {
          name: loc.name,
          nameDe: loc.nameDe,
          nameEn: loc.nameEn,
          nameSl: loc.nameSl,
          latitude: loc.latitude,
          longitude: loc.longitude,
        };
      }
    }

    if (!locationInfo) {
      return NextResponse.json(
        { error: "Location data not found" },
        { status: 500 }
      );
    }

    // Determine time limit
    const gameType = targetRound.gameType || game.gameType || "country:switzerland";
    // Default time limits: 30s for regular games, 60s for panorama
    const isPanoramaGame = isPanoramaGameType(gameType);
    const defaultTimeLimit = isPanoramaGame ? 60 : 30;
    const timeLimitSeconds = targetRound.timeLimitSeconds ?? game.timeLimitSeconds ?? defaultTimeLimit;

    // For panorama games, don't show the location name (GeoGuessr experience)
    const isPanorama = isPanoramaGameType(targetRound.gameType);
    const isCountryQuiz = targetRound.gameType?.startsWith("world:") &&
      ["country-flags", "place-names"].includes(targetRound.gameType.split(":")[1]);

    const locationName = isPanorama
      ? ""
      : isCountryQuiz
        ? locationInfo.name
        : getLocalizedName(locationInfo, locale);

    return NextResponse.json({
      round: {
        id: targetRound.id,
        roundNumber: targetRound.roundNumber,
        locationIndex: targetRound.locationIndex,
        locationName,
        latitude: locationInfo.latitude,
        longitude: locationInfo.longitude,
        country: targetRound.country,
        gameType: targetRound.gameType,
        timeLimitSeconds,
        // Panorama-specific fields
        mapillaryImageKey: locationInfo.mapillaryImageKey ?? null,
        heading: locationInfo.heading ?? null,
        pitch: locationInfo.pitch ?? null,
      },
      timeRemaining: timeLimitSeconds,
      startedAt: now,
    });
  } catch (error) {
    logger.error("Error starting location", error);
    return NextResponse.json(
      { error: "Failed to start location" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ranked/games/[gameId]/start-location
 *
 * Returns the current active location's remaining time and data.
 * Used for recovering state after browser refresh.
 */
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

    // No active location started yet
    if (!game.locationStartedAt || !game.activeLocationIndex) {
      return NextResponse.json({
        activeRound: null,
        needsStart: true,
        nextLocationIndex: 1,
      });
    }

    // Fetch the active round
    const allRounds = await db
      .select()
      .from(gameRounds)
      .where(eq(gameRounds.gameId, gameId))
      .orderBy(gameRounds.locationIndex);

    const activeRound = allRounds.find(r => r.locationIndex === game.activeLocationIndex);
    if (!activeRound) {
      return NextResponse.json({
        activeRound: null,
        needsStart: true,
        nextLocationIndex: game.activeLocationIndex,
      });
    }

    // Check if already guessed
    let alreadyGuessed = false;
    if (session?.user?.id) {
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
      alreadyGuessed = !!existingGuess;
    }

    if (alreadyGuessed) {
      // This location was already guessed, determine next location
      const nextIndex = (game.activeLocationIndex ?? 1) + 1;
      return NextResponse.json({
        activeRound: null,
        alreadyGuessed: true,
        needsStart: nextIndex <= 5,
        nextLocationIndex: nextIndex <= 5 ? nextIndex : null,
        gameComplete: nextIndex > 5,
      });
    }

    // Anti-cheat: Refresh during active round = automatic timeout
    // If locationStartedAt is set and user hasn't guessed yet, they refreshed during gameplay
    if (session?.user?.id && game.locationStartedAt) {
      logger.info("Refresh detected during active round - applying timeout penalty", {
        gameId,
        locationIndex: game.activeLocationIndex,
        userId: session.user.id,
      });

      // Get timeout penalty from game type config
      const gameType = activeRound.gameType || game.gameType || "country:switzerland";
      const config = getGameTypeConfig(gameType);
      const timeoutPenalty = config.timeoutPenalty;

      // Calculate time limit for logging
      const isPanoramaGame = isPanoramaGameType(gameType);
      const defaultTimeLimit = isPanoramaGame ? 60 : 30;
      const timeLimitSeconds = activeRound.timeLimitSeconds ?? game.timeLimitSeconds ?? defaultTimeLimit;

      // 1. Create timeout guess for this round
      await db.insert(guesses).values({
        id: nanoid(),
        gameRoundId: activeRound.id,
        userId: session.user.id,
        latitude: null,
        longitude: null,
        distanceKm: timeoutPenalty,
        timeSeconds: timeLimitSeconds,
        createdAt: new Date(),
      });

      // 2. Reset locationStartedAt
      await db
        .update(games)
        .set({ locationStartedAt: null })
        .where(eq(games.id, gameId));

      // 3. Return next location info
      const nextIndex = (game.activeLocationIndex ?? 1) + 1;
      return NextResponse.json({
        activeRound: null,
        refreshPenalty: true,
        needsStart: nextIndex <= 5,
        nextLocationIndex: nextIndex <= 5 ? nextIndex : null,
        gameComplete: nextIndex > 5,
      });
    }

    // Calculate remaining time
    const gameType = activeRound.gameType || game.gameType || "country:switzerland";
    // Default time limits: 30s for regular games, 60s for panorama
    const isPanoramaGame = isPanoramaGameType(gameType);
    const defaultTimeLimit = isPanoramaGame ? 60 : 30;
    const timeLimitSeconds = activeRound.timeLimitSeconds ?? game.timeLimitSeconds ?? defaultTimeLimit;
    const elapsedMs = Date.now() - game.locationStartedAt;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    const timeRemaining = Math.max(0, timeLimitSeconds - elapsedSeconds);

    // Fetch location details
    let locationInfo: {
      name: string;
      nameDe: string | null;
      nameEn: string | null;
      nameSl: string | null;
      latitude: number;
      longitude: number;
      mapillaryImageKey?: string | null;
      heading?: number | null;
      pitch?: number | null;
    } | null = null;

    if (activeRound.locationSource === "panoramaLocations") {
      const loc = await db
        .select()
        .from(panoramaLocations)
        .where(eq(panoramaLocations.id, activeRound.locationId))
        .get();
      if (loc) {
        locationInfo = {
          name: loc.name,
          nameDe: loc.nameDe,
          nameEn: loc.nameEn,
          nameSl: loc.nameSl,
          latitude: loc.latitude,
          longitude: loc.longitude,
          mapillaryImageKey: loc.mapillaryImageKey,
          heading: loc.heading,
          pitch: loc.pitch,
        };
      }
    } else if (activeRound.locationSource === "worldLocations") {
      const loc = await db
        .select()
        .from(worldLocations)
        .where(eq(worldLocations.id, activeRound.locationId))
        .get();
      if (loc) {
        locationInfo = {
          name: loc.name,
          nameDe: loc.nameDe,
          nameEn: loc.nameEn,
          nameSl: loc.nameSl,
          latitude: loc.latitude,
          longitude: loc.longitude,
        };
      }
    } else {
      const loc = await db
        .select()
        .from(locations)
        .where(eq(locations.id, activeRound.locationId))
        .get();
      if (loc) {
        locationInfo = {
          name: loc.name,
          nameDe: loc.nameDe,
          nameEn: loc.nameEn,
          nameSl: loc.nameSl,
          latitude: loc.latitude,
          longitude: loc.longitude,
        };
      }
    }

    if (!locationInfo) {
      return NextResponse.json(
        { error: "Location data not found" },
        { status: 500 }
      );
    }

    // For panorama games, don't show the location name
    const isPanorama = isPanoramaGameType(activeRound.gameType);
    const isCountryQuiz = activeRound.gameType?.startsWith("world:") &&
      ["country-flags", "place-names"].includes(activeRound.gameType.split(":")[1]);

    const locationName = isPanorama
      ? ""
      : isCountryQuiz
        ? locationInfo.name
        : getLocalizedName(locationInfo, locale);

    return NextResponse.json({
      activeRound: {
        id: activeRound.id,
        roundNumber: activeRound.roundNumber,
        locationIndex: activeRound.locationIndex,
        locationName,
        latitude: locationInfo.latitude,
        longitude: locationInfo.longitude,
        country: activeRound.country,
        gameType: activeRound.gameType,
        timeLimitSeconds,
        mapillaryImageKey: locationInfo.mapillaryImageKey ?? null,
        heading: locationInfo.heading ?? null,
        pitch: locationInfo.pitch ?? null,
      },
      timeRemaining,
      startedAt: game.locationStartedAt,
      timeExpired: timeRemaining <= 0,
    });
  } catch (error) {
    logger.error("Error getting active location", error);
    return NextResponse.json(
      { error: "Failed to get active location" },
      { status: 500 }
    );
  }
}
