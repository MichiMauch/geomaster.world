import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { activityLogger } from "@/lib/activity-logger";
import { games, gameRounds, guesses, worldQuizTypes, countries, panoramaTypes, rankings as rankingsTable, userStreaks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { calculateScore } from "@/lib/scoring";
import { RankingService } from "@/lib/services/ranking-service";
import { checkLevelUp, getLevelName } from "@/lib/levels";

/**
 * Update user's streak after completing a game
 */
async function updateStreak(userId: string): Promise<{ current: number; longest: number }> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const existing = await db
    .select()
    .from(userStreaks)
    .where(eq(userStreaks.userId, userId))
    .get();

  if (!existing) {
    // First game ever - create streak record
    await db.insert(userStreaks).values({
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastPlayedDate: today,
      updatedAt: new Date(),
    });
    return { current: 1, longest: 1 };
  }

  // Already played today - no streak update needed
  if (existing.lastPlayedDate === today) {
    return { current: existing.currentStreak, longest: existing.longestStreak };
  }

  // Check if played yesterday (continue streak) or earlier (reset)
  const lastPlayed = existing.lastPlayedDate ? new Date(existing.lastPlayedDate) : null;
  const todayDate = new Date(today);

  let newStreak = 1;
  if (lastPlayed) {
    const diffDays = Math.floor((todayDate.getTime() - lastPlayed.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      // Played yesterday - continue streak
      newStreak = existing.currentStreak + 1;
    }
    // If diffDays > 1, streak resets to 1
  }

  const newLongest = Math.max(newStreak, existing.longestStreak);

  await db
    .update(userStreaks)
    .set({
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastPlayedDate: today,
      updatedAt: new Date(),
    })
    .where(eq(userStreaks.userId, userId));

  return { current: newStreak, longest: newLongest };
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  try {
    const body = await request.json();
    const { gameId, guestId } = body;

    if (!gameId) {
      return NextResponse.json(
        { error: "Game ID is required" },
        { status: 400 }
      );
    }

    // Fetch the game
    const game = await db
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .get();

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Fetch scoreScaleFactor from DB for dynamic game types (countries and world quizzes)
    let dbScoreScaleFactor: number | undefined;
    if (game.gameType?.startsWith("world:")) {
      const worldQuizId = game.gameType.split(":")[1];
      const worldQuiz = await db
        .select({ scoreScaleFactor: worldQuizTypes.scoreScaleFactor })
        .from(worldQuizTypes)
        .where(eq(worldQuizTypes.id, worldQuizId))
        .get();

      if (worldQuiz) {
        dbScoreScaleFactor = worldQuiz.scoreScaleFactor;
      }
    } else if (game.gameType?.startsWith("country:")) {
      const countryId = game.gameType.split(":")[1];
      const country = await db
        .select({ scoreScaleFactor: countries.scoreScaleFactor })
        .from(countries)
        .where(eq(countries.id, countryId))
        .get();

      if (country) {
        dbScoreScaleFactor = country.scoreScaleFactor;
      }
    } else if (game.gameType?.startsWith("panorama:")) {
      const panoramaId = game.gameType.split(":")[1];
      const panorama = await db
        .select({ scoreScaleFactor: panoramaTypes.scoreScaleFactor })
        .from(panoramaTypes)
        .where(eq(panoramaTypes.id, panoramaId))
        .get();

      if (panorama) {
        dbScoreScaleFactor = panorama.scoreScaleFactor;
      }
    }

    // Verify ownership (user must own the game or provide matching guestId)
    const userId = session?.user?.id;

    // Explicit auth check - ranked games require authentication
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    if (game.userId !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Fetch all game rounds for this game
    const rounds = await db
      .select()
      .from(gameRounds)
      .where(eq(gameRounds.gameId, gameId));

    if (rounds.length === 0) {
      return NextResponse.json(
        { error: "No rounds found for this game" },
        { status: 400 }
      );
    }

    // Fetch all guesses for this game
    const userGuesses = await db
      .select({
        id: guesses.id,
        gameRoundId: guesses.gameRoundId,
        distanceKm: guesses.distanceKm,
        timeSeconds: guesses.timeSeconds,
      })
      .from(guesses)
      .where(eq(guesses.userId, userId));

    // Filter guesses for this game's rounds
    const roundIds = rounds.map((r) => r.id);
    const gameGuesses = userGuesses.filter((g) => roundIds.includes(g.gameRoundId));

    // Verify all 5 locations have been guessed
    if (gameGuesses.length !== 5) {
      return NextResponse.json(
        { error: `Game incomplete. ${gameGuesses.length}/5 locations guessed.` },
        { status: 400 }
      );
    }

    // Calculate total score and distance
    let totalScore = 0;
    let totalDistance = 0;

    for (const guess of gameGuesses) {
      const round = rounds.find((r) => r.id === guess.gameRoundId);
      if (!round) continue;

      const gameType = round.gameType || game.gameType || "country:switzerland";

      // Use new scoring service with version and time data
      const score = calculateScore(
        {
          distanceKm: guess.distanceKm,
          timeSeconds: guess.timeSeconds,
          gameType,
          scoreScaleFactor: dbScoreScaleFactor, // Pass DB value for dynamic game types
        },
        game.scoringVersion || 1 // Use game's scoring version, default to v1 for old games
      );

      totalScore += score;
      totalDistance += guess.distanceKm;
    }

    const averageScore = totalScore / 5;

    // Get user's current total score BEFORE this game (for level-up check)
    let previousTotalScore = 0;
    if (userId) {
      const currentRanking = await db
        .select({ totalScore: rankingsTable.totalScore })
        .from(rankingsTable)
        .where(
          and(
            eq(rankingsTable.userId, userId),
            eq(rankingsTable.period, "alltime"),
            eq(rankingsTable.gameType, "overall")
          )
        )
        .get();
      previousTotalScore = currentRanking?.totalScore ?? 0;
    }

    // Update game status to completed
    await db
      .update(games)
      .set({ status: "completed" })
      .where(eq(games.id, gameId));

    // Record in ranked game results and update rankings
    await RankingService.recordRankedGame({
      gameId,
      userId: userId || null,
      guestId: userId ? null : (guestId || null),
      gameType: game.gameType || "country:switzerland",
      totalScore,
      averageScore,
      totalDistance,
    });

    // Check for level-up and update streak
    let levelUp = null;
    let streak = null;
    if (userId) {
      // Update streak
      streak = await updateStreak(userId);

      const newTotalScore = previousTotalScore + totalScore;
      const levelCheck = checkLevelUp(previousTotalScore, newTotalScore);

      if (levelCheck.leveledUp) {
        // Get locale from request
        const acceptLanguage = request.headers.get("accept-language") || "en";
        const locale = acceptLanguage.split(",")[0].split("-")[0];

        levelUp = {
          leveledUp: true,
          previousLevel: levelCheck.previousLevel.level,
          newLevel: levelCheck.newLevel.level,
          newLevelName: getLevelName(levelCheck.newLevel, locale),
        };
      }
    }

    // Get user's current rankings if logged in
    let rankings = null;
    if (userId && game.gameType) {
      rankings = {
        daily: await RankingService.getUserRank({
          userId,
          gameType: game.gameType,
          period: "daily",
        }),
        weekly: await RankingService.getUserRank({
          userId,
          gameType: game.gameType,
          period: "weekly",
        }),
        monthly: await RankingService.getUserRank({
          userId,
          gameType: game.gameType,
          period: "monthly",
        }),
        alltime: await RankingService.getUserRank({
          userId,
          gameType: game.gameType,
          period: "alltime",
        }),
      };
    }

    // Log game completed (non-blocking)
    activityLogger.logGame("completed", userId, gameId, {
      totalScore,
      averageScore,
      gameType: game.gameType,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      totalScore,
      averageScore,
      totalDistance,
      rankings,
      levelUp,
      streak,
      message: userId ? "Game completed and ranked!" : "Game completed! Login to appear in rankings.",
    });
  } catch (error) {
    logger.error("Error completing ranked game", error);
    return NextResponse.json(
      { error: "Failed to complete ranked game" },
      { status: 500 }
    );
  }
}
