import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { rankings, userStreaks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserLevel, getLevelProgress, getLevelName, LEVELS } from "@/lib/levels";
import { logger } from "@/lib/logger";

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

    // Get user's streak data
    const streak = await db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.userId, session.user.id))
      .get();

    // Get locale from request headers or default to "en"
    const acceptLanguage = request.headers.get("accept-language") || "en";
    const locale = acceptLanguage.split(",")[0].split("-")[0];

    // Build all levels data with localized names
    const allLevels = LEVELS.map((lvl) => ({
      level: lvl.level,
      name: getLevelName(lvl, locale),
      minPoints: lvl.minPoints,
      achieved: totalPoints >= lvl.minPoints,
    }));

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
      // Streak data
      streak: {
        current: streak?.currentStreak ?? 0,
        longest: streak?.longestStreak ?? 0,
        lastPlayedDate: streak?.lastPlayedDate ?? null,
      },
      // All levels for badge display
      allLevels,
    }, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    logger.error("Error fetching user level", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
