import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { rankedGameResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { RankingService } from "@/lib/services/ranking-service";

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
      totalScore: result.totalScore,
      averageScore: result.averageScore,
      totalDistance: result.totalDistance,
      completedAt: result.completedAt,
      rankings: userRankings,
    });
  } catch (error) {
    console.error("Error fetching results:", error);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}
