import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { duelResults, users } from "@/lib/db/schema";
import { eq, or, desc } from "drizzle-orm";
import { getDisplayName } from "@/lib/utils";

export interface DuelHistoryEntry {
  id: string;
  duelSeed: string;
  gameType: string;
  opponentId: string;
  opponentName: string;
  opponentImage: string | null;
  myScore: number;
  myTime: number;
  opponentScore: number;
  opponentTime: number;
  isWinner: boolean;
  myRole: "challenger" | "accepter";
  createdAt: string;
}

/**
 * GET /api/ranked/duel/history - Get duel history for logged-in user
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const gameType = searchParams.get("gameType"); // Optional filter

    const userId = session.user.id;

    // Build query for duels where user is either challenger or accepter
    const query = db
      .select()
      .from(duelResults)
      .where(
        or(
          eq(duelResults.challengerId, userId),
          eq(duelResults.accepterId, userId)
        )
      )
      .orderBy(desc(duelResults.createdAt))
      .limit(limit)
      .offset(offset);

    // Note: SQLite/Drizzle doesn't support dynamic where conditions easily,
    // so we filter in memory for gameType
    const allDuels = await query;

    const filteredDuels = gameType
      ? allDuels.filter(d => d.gameType === gameType)
      : allDuels;

    // Transform to history entries with opponent info
    const history: DuelHistoryEntry[] = [];

    for (const duel of filteredDuels) {
      const isChallenger = duel.challengerId === userId;
      const opponentId = isChallenger ? duel.accepterId : duel.challengerId;

      // Get opponent info
      const opponent = await db
        .select()
        .from(users)
        .where(eq(users.id, opponentId))
        .get();

      history.push({
        id: duel.id,
        duelSeed: duel.duelSeed,
        gameType: duel.gameType,
        opponentId,
        opponentName: opponent
          ? getDisplayName(opponent.name, opponent.nickname)
          : "Anonym",
        opponentImage: opponent?.image || null,
        myScore: isChallenger ? duel.challengerScore : duel.accepterScore,
        myTime: isChallenger ? duel.challengerTime : duel.accepterTime,
        opponentScore: isChallenger ? duel.accepterScore : duel.challengerScore,
        opponentTime: isChallenger ? duel.accepterTime : duel.challengerTime,
        isWinner: duel.winnerId === userId,
        myRole: isChallenger ? "challenger" : "accepter",
        createdAt: duel.createdAt.toISOString(),
      });
    }

    return NextResponse.json({
      duels: history,
      hasMore: filteredDuels.length === limit,
    });
  } catch (error) {
    console.error("Error fetching duel history:", error);
    return NextResponse.json(
      { error: "Failed to fetch duel history" },
      { status: 500 }
    );
  }
}
