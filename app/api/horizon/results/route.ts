import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { horizonResults, users } from "@/lib/db/schema";
import { eq, desc, sql, count, gt } from "drizzle-orm";

// POST — Save game result on game over
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { score, roundsSurvived } = body;

    if (typeof score !== "number" || typeof roundsSurvived !== "number") {
      return NextResponse.json(
        { error: "score and roundsSurvived are required" },
        { status: 400 }
      );
    }

    const result = await db.insert(horizonResults).values({
      userId: session.user.id,
      score,
      roundsSurvived,
      completedAt: new Date(),
    }).returning({ id: horizonResults.id });

    return NextResponse.json({ success: true, id: result[0].id });
  } catch (error) {
    console.error("Failed to save horizon result:", error);
    return NextResponse.json(
      { error: "Failed to save result" },
      { status: 500 }
    );
  }
}

// GET — Fetch leaderboard
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    // Individual games with user info, sorted by score
    const leaderboard = await db
      .select({
        id: horizonResults.id,
        userId: horizonResults.userId,
        score: horizonResults.score,
        roundsSurvived: horizonResults.roundsSurvived,
        completedAt: horizonResults.completedAt,
        name: users.name,
        nickname: users.nickname,
        image: users.image,
      })
      .from(horizonResults)
      .innerJoin(users, eq(horizonResults.userId, users.id))
      .orderBy(desc(horizonResults.score))
      .limit(limit);

    // Check if the current user is logged in and find the rank of their best game
    let userRank: number | null = null;
    const session = await getServerSession(authOptions);

    if (session?.user?.id) {
      // Find user's best game in the returned list
      const userEntry = leaderboard.findIndex(
        (entry) => entry.userId === session.user.id
      );
      if (userEntry !== -1) {
        userRank = userEntry + 1;
      } else {
        // User not in top N — count how many individual games have a higher score than user's best
        const userBest = await db
          .select({
            bestScore: sql<number>`MAX(${horizonResults.score})`.as("bestScore"),
          })
          .from(horizonResults)
          .where(eq(horizonResults.userId, session.user.id))
          .get();

        if (userBest?.bestScore != null) {
          const higherCount = await db
            .select({
              count: count(horizonResults.id).as("count"),
            })
            .from(horizonResults)
            .where(gt(horizonResults.score, userBest.bestScore))
            .get();

          userRank = (higherCount?.count ?? 0) + 1;
        }
      }
    }

    return NextResponse.json(
      { leaderboard, userRank },
      {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch horizon leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
