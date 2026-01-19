import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { NotificationService } from "@/lib/services/notification-service";
import { getDisplayName } from "@/lib/utils";
import { logger } from "@/lib/logger";

/**
 * POST /api/ranked/games/duel/invite
 * Send a duel challenge notification to a specific user
 *
 * Body: {
 *   targetUserId: string;
 *   challengeUrl: string;
 *   gameType: string;
 *   gameName: string;
 *   locale?: string;
 * }
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { targetUserId, challengeUrl, gameType, gameName, locale = "de" } = body;

    // Validate required fields
    if (!targetUserId || !challengeUrl || !gameType || !gameName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Prevent self-invite
    if (targetUserId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot invite yourself" },
        { status: 400 }
      );
    }

    // Validate target user exists
    const targetUser = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .get();

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get challenger display name
    const challenger = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .get();

    const challengerName = challenger
      ? getDisplayName(challenger.name, challenger.nickname)
      : "Unbekannt";

    // Create notification
    const notificationId = await NotificationService.notifyDuelChallengeReceived({
      targetUserId,
      challengerName,
      challengeUrl,
      gameType,
      gameName,
      locale,
    });

    return NextResponse.json({
      success: true,
      notificationId,
    });
  } catch (error) {
    logger.error("Error sending duel invite", error);
    return NextResponse.json(
      { error: "Failed to send invite" },
      { status: 500 }
    );
  }
}
