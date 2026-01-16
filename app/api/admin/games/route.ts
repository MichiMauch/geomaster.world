import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  games,
  gameRounds,
  guesses,
  users,
  groups,
  locations,
  worldLocations,
  panoramaLocations,
  imageLocations,
} from "@/lib/db/schema";
import { eq, and, gte, lte, desc, sql, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import {
  getScoringStrategyByVersion,
  calculateTimeMultiplier,
} from "@/lib/scoring/strategies";
import { getGameTypeConfig } from "@/lib/game-types";

// Helper to get scoreScaleFactor for a game type
function getScoreScaleFactor(gameType: string): number {
  const config = getGameTypeConfig(gameType);
  return config?.scoreScaleFactor ?? 3000;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const mode = searchParams.get("mode") as "group" | "training" | "ranked" | null;
    const gameType = searchParams.get("gameType");
    const status = searchParams.get("status") as "active" | "completed" | null;
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build WHERE conditions
    const conditions = [];

    if (mode) {
      conditions.push(eq(games.mode, mode));
    }
    if (gameType) {
      conditions.push(eq(games.gameType, gameType));
    }
    if (status) {
      conditions.push(eq(games.status, status));
    }
    if (userId) {
      conditions.push(eq(games.userId, userId));
    }
    if (startDate) {
      conditions.push(gte(games.createdAt, new Date(startDate)));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      conditions.push(lte(games.createdAt, end));
    }

    // Count total for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(games)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .get();

    const total = countResult?.count || 0;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Fetch games with user and group info (1 query)
    const gamesData = await db
      .select({
        id: games.id,
        gameType: games.gameType,
        mode: games.mode,
        status: games.status,
        userId: games.userId,
        groupId: games.groupId,
        scoringVersion: games.scoringVersion,
        createdAt: games.createdAt,
        locationsPerRound: games.locationsPerRound,
        timeLimitSeconds: games.timeLimitSeconds,
        userName: users.name,
        userImage: users.image,
        groupName: groups.name,
      })
      .from(games)
      .leftJoin(users, eq(games.userId, users.id))
      .leftJoin(groups, eq(games.groupId, groups.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(games.createdAt))
      .limit(limit)
      .offset(offset);

    if (gamesData.length === 0) {
      return NextResponse.json({
        games: [],
        pagination: { page, limit, total, totalPages },
      });
    }

    const gameIds = gamesData.map((g) => g.id);

    // Fetch all rounds for all games in ONE query
    const allRounds = await db
      .select({
        id: gameRounds.id,
        gameId: gameRounds.gameId,
        roundNumber: gameRounds.roundNumber,
        locationIndex: gameRounds.locationIndex,
        locationId: gameRounds.locationId,
        locationSource: gameRounds.locationSource,
        gameType: gameRounds.gameType,
        timeLimitSeconds: gameRounds.timeLimitSeconds,
      })
      .from(gameRounds)
      .where(inArray(gameRounds.gameId, gameIds))
      .orderBy(gameRounds.gameId, gameRounds.roundNumber, gameRounds.locationIndex);

    if (allRounds.length === 0) {
      // No rounds, return games without rounds
      const gamesWithDetails = gamesData.map((game) => ({
        id: game.id,
        gameType: game.gameType,
        mode: game.mode,
        status: game.status,
        userId: game.userId,
        userName: game.userName,
        userImage: game.userImage,
        groupId: game.groupId,
        groupName: game.groupName,
        scoringVersion: game.scoringVersion || 2,
        createdAt: game.createdAt?.toISOString() || null,
        locationsPerRound: game.locationsPerRound,
        timeLimitSeconds: game.timeLimitSeconds,
        rounds: [],
      }));

      return NextResponse.json({
        games: gamesWithDetails,
        pagination: { page, limit, total, totalPages },
      });
    }

    const roundIds = allRounds.map((r) => r.id);

    // Fetch all guesses for all rounds in ONE query
    const allGuesses = await db
      .select({
        id: guesses.id,
        gameRoundId: guesses.gameRoundId,
        oderId: guesses.userId,
        latitude: guesses.latitude,
        longitude: guesses.longitude,
        distanceKm: guesses.distanceKm,
        timeSeconds: guesses.timeSeconds,
        createdAt: guesses.createdAt,
        userName: users.name,
        userImage: users.image,
      })
      .from(guesses)
      .leftJoin(users, eq(guesses.userId, users.id))
      .where(inArray(guesses.gameRoundId, roundIds));

    // Batch fetch all location names by source type (max 4 queries)
    const locationIdsBySource = {
      worldLocations: [] as string[],
      panoramaLocations: [] as string[],
      imageLocations: [] as string[],
      locations: [] as string[],
    };

    for (const round of allRounds) {
      const source = round.locationSource || "locations";
      if (source === "worldLocations") {
        locationIdsBySource.worldLocations.push(round.locationId);
      } else if (source === "panoramaLocations") {
        locationIdsBySource.panoramaLocations.push(round.locationId);
      } else if (source === "imageLocations") {
        locationIdsBySource.imageLocations.push(round.locationId);
      } else {
        locationIdsBySource.locations.push(round.locationId);
      }
    }

    // Fetch location names in batch (up to 4 queries instead of N)
    const locationNameMap = new Map<string, string>();

    if (locationIdsBySource.worldLocations.length > 0) {
      const locs = await db
        .select({ id: worldLocations.id, name: worldLocations.name })
        .from(worldLocations)
        .where(inArray(worldLocations.id, locationIdsBySource.worldLocations));
      for (const loc of locs) {
        locationNameMap.set(loc.id, loc.name);
      }
    }

    if (locationIdsBySource.panoramaLocations.length > 0) {
      const locs = await db
        .select({ id: panoramaLocations.id, name: panoramaLocations.name })
        .from(panoramaLocations)
        .where(inArray(panoramaLocations.id, locationIdsBySource.panoramaLocations));
      for (const loc of locs) {
        locationNameMap.set(loc.id, loc.name);
      }
    }

    if (locationIdsBySource.imageLocations.length > 0) {
      const locs = await db
        .select({ id: imageLocations.id, name: imageLocations.name })
        .from(imageLocations)
        .where(inArray(imageLocations.id, locationIdsBySource.imageLocations));
      for (const loc of locs) {
        locationNameMap.set(loc.id, loc.name);
      }
    }

    if (locationIdsBySource.locations.length > 0) {
      const locs = await db
        .select({ id: locations.id, name: locations.name })
        .from(locations)
        .where(inArray(locations.id, locationIdsBySource.locations));
      for (const loc of locs) {
        locationNameMap.set(loc.id, loc.name);
      }
    }

    // Group guesses by round ID for fast lookup
    const guessesByRoundId = new Map<string, typeof allGuesses>();
    for (const guess of allGuesses) {
      const existing = guessesByRoundId.get(guess.gameRoundId) || [];
      existing.push(guess);
      guessesByRoundId.set(guess.gameRoundId, existing);
    }

    // Group rounds by game ID for fast lookup
    const roundsByGameId = new Map<string, typeof allRounds>();
    for (const round of allRounds) {
      const existing = roundsByGameId.get(round.gameId) || [];
      existing.push(round);
      roundsByGameId.set(round.gameId, existing);
    }

    // Build the final response in memory
    const gamesWithDetails = gamesData.map((game) => {
      const gameRoundsData = roundsByGameId.get(game.id) || [];
      const scoringVersion = game.scoringVersion || 2;

      const roundsWithGuesses = gameRoundsData.map((round) => {
        const effectiveGameType = round.gameType || game.gameType || "country:switzerland";
        const scoreScaleFactor = getScoreScaleFactor(effectiveGameType);
        const roundGuesses = guessesByRoundId.get(round.id) || [];

        const guessesWithScoring = roundGuesses.map((guess) => {
          // Calculate base score (distance only - v1)
          const distanceOnlyStrategy = getScoringStrategyByVersion(1);
          const baseScore = distanceOnlyStrategy.calculateRoundScore({
            distanceKm: guess.distanceKm,
            timeSeconds: null,
            gameType: effectiveGameType,
            scoreScaleFactor,
          });

          // Calculate time multiplier
          const timeMultiplier = calculateTimeMultiplier(guess.timeSeconds);

          // Calculate final score using game's scoring version
          const strategy = getScoringStrategyByVersion(scoringVersion);
          const calculatedScore = strategy.calculateRoundScore({
            distanceKm: guess.distanceKm,
            timeSeconds: guess.timeSeconds,
            gameType: effectiveGameType,
            scoreScaleFactor,
          });

          return {
            id: guess.id,
            oderId: guess.oderId,
            userName: guess.userName,
            userImage: guess.userImage,
            latitude: guess.latitude,
            longitude: guess.longitude,
            distanceKm: guess.distanceKm,
            timeSeconds: guess.timeSeconds,
            baseScore,
            timeMultiplier,
            calculatedScore,
            createdAt: guess.createdAt?.toISOString() || null,
          };
        });

        return {
          id: round.id,
          roundNumber: round.roundNumber,
          locationIndex: round.locationIndex,
          locationId: round.locationId,
          locationName: locationNameMap.get(round.locationId) || "Unknown",
          locationSource: round.locationSource,
          gameType: effectiveGameType,
          timeLimitSeconds: round.timeLimitSeconds,
          guesses: guessesWithScoring,
        };
      });

      return {
        id: game.id,
        gameType: game.gameType,
        mode: game.mode,
        status: game.status,
        userId: game.userId,
        userName: game.userName,
        userImage: game.userImage,
        groupId: game.groupId,
        groupName: game.groupName,
        scoringVersion,
        createdAt: game.createdAt?.toISOString() || null,
        locationsPerRound: game.locationsPerRound,
        timeLimitSeconds: game.timeLimitSeconds,
        rounds: roundsWithGuesses,
      };
    });

    return NextResponse.json({
      games: gamesWithDetails,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    logger.error("Error fetching admin games", error);
    return NextResponse.json(
      { error: "Failed to fetch games" },
      { status: 500 }
    );
  }
}
