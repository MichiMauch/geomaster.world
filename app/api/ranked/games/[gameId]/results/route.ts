import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { rankedGameResults, worldQuizTypes, countries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { RankingService } from "@/lib/services/ranking-service";
import { GAME_TYPES } from "@/lib/game-types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const session = await getServerSession(authOptions);
  const { gameId } = await params;

  try {
    // Fetch the completed game result
    const result = await db
      .select()
      .from(rankedGameResults)
      .where(eq(rankedGameResults.gameId, gameId))
      .get();

    if (!result) {
      return NextResponse.json(
        { error: "Results not found" },
        { status: 404 }
      );
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

    // If user is logged in, fetch their rankings for this game type
    let userRankings: Record<string, any> | null = null;
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
    });
  } catch (error) {
    logger.error("Error fetching results", error);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}
