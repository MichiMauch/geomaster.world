import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { RankingService, type RankingPeriod } from "@/lib/services/ranking-service";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  try {
    const { searchParams } = new URL(request.url);
    const gameType = searchParams.get("gameType") || "overall";
    const mode = searchParams.get("mode") || "rankings"; // "rankings" or "games"
    const period = (searchParams.get("period") || "alltime") as RankingPeriod;
    const periodKey = searchParams.get("periodKey") || undefined;
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");
    const sortBy = (searchParams.get("sortBy") || "best") as "best" | "total";

    // Mode "games": Return individual game results (player can appear multiple times)
    if (mode === "games") {
      const topGames = await RankingService.getTopGames({
        gameType,
        period, // Pass period for filtering (weekly, daily, monthly)
        limit,
        offset,
      });

      // Get user's game stats (games count, best score, rank) if logged in
      let userGameStats = null;
      if (session?.user?.id) {
        userGameStats = await RankingService.getUserGameStats({
          userId: session.user.id,
          gameType,
          period,
        });
      }

      return NextResponse.json({
        rankings: topGames.map((g) => ({
          rank: g.rank,
          userName: g.userName,
          userImage: g.userImage,
          bestScore: g.totalScore, // use bestScore field for consistency
          gameId: g.gameId,
          completedAt: g.completedAt,
        })),
        userGameStats,
        gameType,
        mode: "games",
        total: topGames.length,
      });
    }

    // Mode "rankings": Return aggregated player rankings (default)
    // Validate period
    const validPeriods: RankingPeriod[] = ["daily", "weekly", "monthly", "alltime"];
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { error: "Invalid period. Must be: daily, weekly, monthly, or alltime" },
        { status: 400 }
      );
    }

    // Validate sortBy
    if (sortBy !== "best" && sortBy !== "total") {
      return NextResponse.json(
        { error: "Invalid sortBy. Must be: best or total" },
        { status: 400 }
      );
    }

    // Get rankings
    const rankings = await RankingService.getRankings({
      gameType,
      period,
      periodKey,
      limit,
      offset,
      sortBy,
    });

    // Get current user's rank if logged in
    let userRank = null;
    if (session?.user?.id) {
      userRank = await RankingService.getUserRank({
        userId: session.user.id,
        gameType,
        period,
        periodKey,
      });
    }

    // Get period information
    const currentPeriodKey = periodKey || RankingService.getCurrentPeriodKey(period);
    const periodLabel = RankingService.getPeriodLabel(period, currentPeriodKey, "de");

    return NextResponse.json({
      rankings,
      userRank,
      period: {
        type: period,
        key: currentPeriodKey,
        label: periodLabel,
      },
      gameType,
      mode: "rankings",
      total: rankings.length,
    });
  } catch (error) {
    logger.error("Error fetching leaderboard", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
