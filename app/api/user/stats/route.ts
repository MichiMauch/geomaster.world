import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { userStats } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const gameType = searchParams.get("gameType");

    // Get user stats
    let statsQuery = db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, session.user.id));

    if (gameType) {
      statsQuery = db
        .select()
        .from(userStats)
        .where(
          and(
            eq(userStats.userId, session.user.id),
            eq(userStats.gameType, gameType)
          )
        );
    }

    const stats = await statsQuery;

    // Calculate totals across all game types
    const totals = stats.reduce(
      (acc, stat) => ({
        totalGames: acc.totalGames + stat.totalGames,
        totalRounds: acc.totalRounds + stat.totalRounds,
        totalDistance: acc.totalDistance + stat.totalDistance,
        totalScore: acc.totalScore + stat.totalScore,
        bestScore: Math.max(acc.bestScore, stat.bestScore),
      }),
      { totalGames: 0, totalRounds: 0, totalDistance: 0, totalScore: 0, bestScore: 0 }
    );

    return NextResponse.json({
      stats,
      totals: {
        ...totals,
        averageDistance: totals.totalRounds > 0
          ? totals.totalDistance / totals.totalRounds
          : 0,
      },
    }, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    logger.error("Error fetching user stats", error);
    return NextResponse.json(
      { error: "Failed to fetch user stats" },
      { status: 500 }
    );
  }
}
