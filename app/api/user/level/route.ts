import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { rankings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserLevel, getLevelProgress, getLevelName } from "@/lib/levels";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's alltime overall ranking to get total score
    const userRanking = await db
      .select()
      .from(rankings)
      .where(
        and(
          eq(rankings.userId, session.user.id),
          eq(rankings.period, "alltime"),
          eq(rankings.gameType, "overall")
        )
      )
      .get();

    const totalPoints = userRanking?.totalScore ?? 0;
    const levelProgress = getLevelProgress(totalPoints);

    // Get locale from request headers or default to "en"
    const acceptLanguage = request.headers.get("accept-language") || "en";
    const locale = acceptLanguage.split(",")[0].split("-")[0];

    return NextResponse.json({
      level: levelProgress.currentLevel.level,
      levelName: getLevelName(levelProgress.currentLevel, locale),
      totalPoints,
      progress: levelProgress.progress,
      pointsToNextLevel: levelProgress.pointsToNext,
      pointsInCurrentLevel: levelProgress.pointsInCurrentLevel,
      nextLevel: levelProgress.nextLevel
        ? {
            level: levelProgress.nextLevel.level,
            levelName: getLevelName(levelProgress.nextLevel, locale),
            minPoints: levelProgress.nextLevel.minPoints,
          }
        : null,
      isMaxLevel: levelProgress.nextLevel === null,
    });
  } catch (error) {
    console.error("Error fetching user level:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
