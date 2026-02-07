import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { horizonResults, users } from "@/lib/db/schema";
import { eq, sql, count, desc } from "drizzle-orm";

// GET /api/horizon/results/me → { bestScore, totalGames, topPlayer }
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Always fetch global #1 player
    const topPlayer = await db
      .select({
        bestScore: sql<number>`MAX(${horizonResults.score})`.as("bestScore"),
        name: users.name,
        nickname: users.nickname,
      })
      .from(horizonResults)
      .innerJoin(users, eq(horizonResults.userId, users.id))
      .groupBy(horizonResults.userId)
      .orderBy(desc(sql`MAX(${horizonResults.score})`))
      .limit(1)
      .get();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          bestScore: null,
          topPlayer: topPlayer
            ? { name: topPlayer.nickname || topPlayer.name, score: topPlayer.bestScore }
            : null,
        },
        {
          headers: {
            "Cache-Control": "private, max-age=30",
          },
        }
      );
    }

    const result = await db
      .select({
        bestScore: sql<number>`MAX(${horizonResults.score})`.as("bestScore"),
        totalGames: count(horizonResults.id).as("totalGames"),
      })
      .from(horizonResults)
      .where(eq(horizonResults.userId, session.user.id))
      .get();

    return NextResponse.json(
      {
        bestScore: result?.bestScore ?? null,
        totalGames: result?.totalGames ?? 0,
        topPlayer: topPlayer
          ? { name: topPlayer.nickname || topPlayer.name, score: topPlayer.bestScore }
          : null,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=30",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch user horizon stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
