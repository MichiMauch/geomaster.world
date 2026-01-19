import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { DuelService } from "@/lib/services/duel-service";

/**
 * GET /api/ranked/leaderboard/duel
 * Get duel leaderboard
 *
 * Query params:
 *   gameType: string (optional) - If not provided, returns overall leaderboard
 *   limit: number (optional) - Default 50
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameType = searchParams.get("gameType");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    let leaderboard;

    if (gameType) {
      // Get leaderboard for specific game type
      leaderboard = await DuelService.getLeaderboard(gameType, limit);
    } else {
      // Get overall leaderboard across all game types
      leaderboard = await DuelService.getOverallLeaderboard(limit);
    }

    return NextResponse.json({
      gameType: gameType || "overall",
      leaderboard,
    });
  } catch (error) {
    logger.error("Error fetching duel leaderboard", error);
    return NextResponse.json(
      { error: "Failed to fetch duel leaderboard" },
      { status: 500 }
    );
  }
}
