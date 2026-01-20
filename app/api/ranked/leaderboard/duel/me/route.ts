import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { DuelService } from "@/lib/services/duel-service";

/**
 * GET /api/ranked/leaderboard/duel/me
 * Get current user's duel stats for a specific game type
 *
 * Query params:
 *   gameType: string (required)
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const gameType = searchParams.get("gameType");

    if (!gameType) {
      return NextResponse.json(
        { error: "gameType parameter is required" },
        { status: 400 }
      );
    }

    const stats = await DuelService.getUserStats(session.user.id, gameType);

    if (!stats) {
      // Return empty stats for users who haven't played any duels
      return NextResponse.json({
        wins: 0,
        losses: 0,
        totalDuels: 0,
        winRate: 0,
        rank: null,
      });
    }

    return NextResponse.json(stats);
  } catch (error) {
    logger.error("Error fetching user duel stats", error);
    return NextResponse.json(
      { error: "Failed to fetch duel stats" },
      { status: 500 }
    );
  }
}
