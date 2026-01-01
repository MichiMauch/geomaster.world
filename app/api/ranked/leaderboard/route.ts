import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { RankingService, type RankingPeriod } from "@/lib/services/ranking-service";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  try {
    const { searchParams } = new URL(request.url);
    const gameType = searchParams.get("gameType") || "overall";
    const period = (searchParams.get("period") || "alltime") as RankingPeriod;
    const periodKey = searchParams.get("periodKey") || undefined;
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");
    const sortBy = (searchParams.get("sortBy") || "best") as "best" | "total";

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
      total: rankings.length,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
