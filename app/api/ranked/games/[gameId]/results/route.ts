import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { rankedGameResults, worldQuizTypes, countries, rankings, games, users, guesses, gameRounds, duelResults, worldLocations, panoramaTypes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { RankingService } from "@/lib/services/ranking-service";
import type { UserRankResult } from "@/lib/services/ranking/types";
import { GAME_TYPES, isSpecialQuizGameType } from "@/lib/game-types";
import { encodeDuelChallenge, type DuelChallenge } from "@/lib/duel-utils";
import { getDisplayName } from "@/lib/utils";
import { calculateScore } from "@/lib/scoring";
import { isPointInCountry } from "@/lib/utils/geo-check";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const session = await getServerSession(authOptions);
  const { gameId } = await params;

  try {
    // First check if this is a duel game - duels don't store in rankedGameResults
    const game = await db
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .get();

    if (!game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    // For duel games: calculate results from guesses (not from rankedGameResults)
    let result: {
      gameId: string;
      userId: string | null;
      gameType: string;
      totalScore: number;
      averageScore: number;
      totalDistance: number;
      completedAt: Date | null;
    } | null = null;

    if (game.mode === "duel") {
      // Calculate score from guesses for duel games
      const rounds = await db
        .select()
        .from(gameRounds)
        .where(eq(gameRounds.gameId, gameId));

      if (rounds.length === 0) {
        return NextResponse.json(
          { error: "No rounds found" },
          { status: 404 }
        );
      }

      // Fetch scoreScaleFactor from DB for dynamic game types
      let dbScoreScaleFactor: number | undefined;
      if (game.gameType?.startsWith("world:")) {
        const worldQuizId = game.gameType.split(":")[1];
        const worldQuiz = await db
          .select({ scoreScaleFactor: worldQuizTypes.scoreScaleFactor })
          .from(worldQuizTypes)
          .where(eq(worldQuizTypes.id, worldQuizId))
          .get();
        if (worldQuiz) dbScoreScaleFactor = worldQuiz.scoreScaleFactor;
      } else if (game.gameType?.startsWith("country:")) {
        const countryId = game.gameType.split(":")[1];
        const country = await db
          .select({ scoreScaleFactor: countries.scoreScaleFactor })
          .from(countries)
          .where(eq(countries.id, countryId))
          .get();
        if (country) dbScoreScaleFactor = country.scoreScaleFactor;
      } else if (game.gameType?.startsWith("panorama:")) {
        const panoramaId = game.gameType.split(":")[1];
        const panorama = await db
          .select({ scoreScaleFactor: panoramaTypes.scoreScaleFactor })
          .from(panoramaTypes)
          .where(eq(panoramaTypes.id, panoramaId))
          .get();
        if (panorama) dbScoreScaleFactor = panorama.scoreScaleFactor;
      }

      let totalScore = 0;
      let totalDistance = 0;

      for (const round of rounds) {
        const guess = await db
          .select()
          .from(guesses)
          .where(and(eq(guesses.gameRoundId, round.id), eq(guesses.userId, game.userId!)))
          .get();

        if (guess) {
          const gameType = round.gameType || game.gameType || "country:switzerland";

          // For special quizzes: check if click was in correct country
          let effectiveDistance = guess.distanceKm;
          if (isSpecialQuizGameType(gameType) && guess.latitude !== null && guess.longitude !== null) {
            const worldLocation = await db
              .select({ countryCode: worldLocations.countryCode })
              .from(worldLocations)
              .where(eq(worldLocations.id, round.locationId))
              .get();

            if (worldLocation?.countryCode) {
              const isCorrect = await isPointInCountry(guess.latitude, guess.longitude, worldLocation.countryCode);
              if (isCorrect) effectiveDistance = 0;
            }
          }

          const score = calculateScore({
            distanceKm: effectiveDistance,
            timeSeconds: guess.timeSeconds,
            gameType,
            scoreScaleFactor: dbScoreScaleFactor,
          });

          totalScore += score;
          totalDistance += guess.distanceKm;
        }
      }

      result = {
        gameId,
        userId: game.userId,
        gameType: game.gameType || "country:switzerland",
        totalScore,
        averageScore: totalScore / 5,
        totalDistance,
        completedAt: game.createdAt,
      };
    } else {
      // For non-duel games: fetch from rankedGameResults as before
      const dbResult = await db
        .select()
        .from(rankedGameResults)
        .where(eq(rankedGameResults.gameId, gameId))
        .get();

      if (!dbResult) {
        return NextResponse.json(
          { error: "Results not found" },
          { status: 404 }
        );
      }

      result = {
        gameId: dbResult.gameId,
        userId: dbResult.userId,
        gameType: dbResult.gameType,
        totalScore: dbResult.totalScore,
        averageScore: dbResult.averageScore,
        totalDistance: dbResult.totalDistance,
        completedAt: dbResult.completedAt,
      };
    }

    // Fetch game type name - check static config first, then database
    let gameTypeName: string | Record<string, string> = result.gameType;

    // Check if it's a static game type (panorama, image, etc.)
    const staticConfig = GAME_TYPES[result.gameType as keyof typeof GAME_TYPES];
    if (staticConfig) {
      // Return the localized name object for client-side locale selection
      gameTypeName = staticConfig.name;
    } else if (result.gameType.startsWith("world:")) {
      const worldQuizId = result.gameType.split(":")[1];
      const worldQuiz = await db.select().from(worldQuizTypes).where(eq(worldQuizTypes.id, worldQuizId)).get();
      if (worldQuiz) {
        gameTypeName = worldQuiz.name;
      }
    } else if (result.gameType.startsWith("country:")) {
      const countryId = result.gameType.split(":")[1];
      const country = await db.select().from(countries).where(eq(countries.id, countryId)).get();
      if (country) {
        gameTypeName = country.name;
      }
    }

    // If user is logged in, fetch their rankings and highscore info
    let userRankings: Record<string, UserRankResult | null> | null = null;
    let isNewHighscore = false;
    let previousBestScore: number | null = null;
    let pointsToHighscore = 0;

    if (session?.user?.id && result.userId === session.user.id) {
      const periods = ["daily", "weekly", "monthly", "alltime"] as const;
      userRankings = {};

      for (const period of periods) {
        const rank = await RankingService.getUserRank({
          userId: session.user.id,
          gameType: result.gameType,
          period,
        });
        userRankings[period] = rank;
      }

      // Get alltime best score for highscore comparison
      const alltimeRanking = await db
        .select({ bestScore: rankings.bestScore })
        .from(rankings)
        .where(
          and(
            eq(rankings.userId, session.user.id),
            eq(rankings.gameType, result.gameType),
            eq(rankings.period, "alltime")
          )
        )
        .get();

      if (alltimeRanking) {
        previousBestScore = alltimeRanking.bestScore;
        // Check if this game score is the new best (or ties it)
        // The bestScore in rankings is updated AFTER game completion, so if equal it means this game set it
        isNewHighscore = result.totalScore >= previousBestScore;
        if (!isNewHighscore) {
          pointsToHighscore = previousBestScore - result.totalScore;
        }
      } else {
        // First game ever for this game type - it's a new highscore
        isNewHighscore = true;
      }
    }

    // Get duel data if applicable (game already fetched above)
    const gameMode = game.mode;
    let duelData = null;

    // If it's a duel game and user is logged in
    if (game.mode === "duel" && game.duelSeed && session?.user?.id) {
      // First, check if user is the accepter in a completed duel
      const completedDuel = await db
        .select()
        .from(duelResults)
        .where(eq(duelResults.accepterGameId, gameId))
        .get();

      if (completedDuel && completedDuel.accepterId === session.user.id) {
        // User is the accepter - return duel result data for redirect
        duelData = {
          role: "accepter" as const,
          duelId: completedDuel.id,
          accepterScore: completedDuel.accepterScore,
          accepterTime: completedDuel.accepterTime,
          challengerScore: completedDuel.challengerScore,
          challengerTime: completedDuel.challengerTime,
        };
      } else if (result.userId === session.user.id) {
        // User is the challenger - generate challenge data for sharing
        const roundsData = await db
          .select({ id: gameRounds.id })
          .from(gameRounds)
          .where(eq(gameRounds.gameId, gameId));

        let totalTime = 0;
        for (const round of roundsData) {
          const guess = await db
            .select({ timeSeconds: guesses.timeSeconds })
            .from(guesses)
            .where(and(eq(guesses.gameRoundId, round.id), eq(guesses.userId, session.user.id)))
            .get();
          if (guess?.timeSeconds) {
            totalTime += guess.timeSeconds;
          }
        }

        // Get user details
        const user = await db.select().from(users).where(eq(users.id, session.user.id)).get();
        const displayName = user ? getDisplayName(user.name, user.nickname) : "Anonym";

        // Generate challenge for sharing (challenger flow)
        const challenge: DuelChallenge = {
          seed: game.duelSeed,
          gameType: result.gameType,
          challengerId: session.user.id,
          challengerName: displayName,
          challengerScore: result.totalScore,
          challengerTime: totalTime,
          challengerGameId: gameId,
        };

        const encodedChallenge = encodeDuelChallenge(challenge);

        duelData = {
          role: "challenger" as const,
          encodedChallenge,
          challengerScore: result.totalScore,
          challengerTime: totalTime,
        };
      }
    }

    return NextResponse.json({
      gameId: result.gameId,
      gameType: result.gameType,
      gameTypeName,
      totalScore: result.totalScore,
      averageScore: result.averageScore,
      totalDistance: result.totalDistance,
      completedAt: result.completedAt,
      rankings: userRankings,
      isNewHighscore,
      previousBestScore,
      pointsToHighscore,
      gameMode,
      duelData,
    }, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    logger.error("Error fetching results", error);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}
