import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { games, gameRounds, guesses, worldQuizTypes, countries, rankings as rankingsTable } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { calculateScore } from "@/lib/scoring";
import { RankingService } from "@/lib/services/ranking-service";
import { checkLevelUp, getLevelName } from "@/lib/levels";

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
    }

    // Verify ownership (user must own the game or provide matching guestId)
    const userId = session?.user?.id;
    if (userId && game.userId !== userId) {
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
      .where(eq(guesses.userId, userId || ""));

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

    // Check for level-up
    let levelUp = null;
    if (userId) {
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

    return NextResponse.json({
      success: true,
      totalScore,
      averageScore,
      totalDistance,
      rankings,
      levelUp,
      message: userId ? "Game completed and ranked!" : "Game completed! Login to appear in rankings.",
    });
  } catch (error) {
    console.error("Error completing ranked game:", error);
    return NextResponse.json(
      { error: "Failed to complete ranked game" },
      { status: 500 }
    );
  }
}
