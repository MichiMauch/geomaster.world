import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { RankingService } from "@/lib/services/ranking-service";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized. Must be logged in." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { guestId } = body;

    if (!guestId) {
      return NextResponse.json(
        { error: "Guest ID is required" },
        { status: 400 }
      );
    }

    // Migrate all guest results to this user
    await RankingService.migrateGuestResults(guestId, session.user.id);

    // Get user's updated stats
    const stats = await RankingService.getUserStats(session.user.id);

    return NextResponse.json({
      success: true,
      message: "Guest results claimed successfully!",
      stats,
    });
  } catch (error) {
    logger.error("Error claiming guest results", error);
    return NextResponse.json(
      { error: "Failed to claim guest results" },
      { status: 500 }
    );
  }
}
