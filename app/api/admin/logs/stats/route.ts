import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { activityLogs, users } from "@/lib/db/schema";
import { eq, and, gte, lt, sql, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * GET /api/admin/logs/stats
 * Get aggregated statistics for charts
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);

    // Date range (default: last 30 days)
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : new Date();
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Ensure end date includes the entire day
    const endDatePlusOne = new Date(endDate);
    endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);

    const dateFilter = and(
      gte(activityLogs.timestamp, startDate),
      lt(activityLogs.timestamp, endDatePlusOne)
    );

    // Total logs count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(activityLogs)
      .where(dateFilter);
    const totalLogs = totalResult[0]?.count || 0;

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayFilter = and(
      gte(activityLogs.timestamp, today),
      lt(activityLogs.timestamp, tomorrow)
    );

    const errorsToday = await db
      .select({ count: sql<number>`count(*)` })
      .from(activityLogs)
      .where(and(todayFilter, eq(activityLogs.level, "error")));

    const warningsToday = await db
      .select({ count: sql<number>`count(*)` })
      .from(activityLogs)
      .where(and(todayFilter, eq(activityLogs.level, "warn")));

    // Logs by day (for line chart)
    const logsByDay = await db
      .select({
        date: sql<string>`date(timestamp / 1000, 'unixepoch')`,
        count: sql<number>`count(*)`,
        errors: sql<number>`sum(case when level = 'error' then 1 else 0 end)`,
      })
      .from(activityLogs)
      .where(dateFilter)
      .groupBy(sql`date(timestamp / 1000, 'unixepoch')`)
      .orderBy(sql`date(timestamp / 1000, 'unixepoch')`);

    // Activity by category (for bar chart)
    const activityByCategory = await db
      .select({
        category: activityLogs.category,
        count: sql<number>`count(*)`,
      })
      .from(activityLogs)
      .where(dateFilter)
      .groupBy(activityLogs.category);

    // Level distribution (for pie chart)
    const levelDistribution = await db
      .select({
        level: activityLogs.level,
        count: sql<number>`count(*)`,
      })
      .from(activityLogs)
      .where(dateFilter)
      .groupBy(activityLogs.level);

    // Top users by activity (for bar chart)
    const topUsers = await db
      .select({
        userId: activityLogs.userId,
        userName: users.name,
        userImage: users.image,
        count: sql<number>`count(*)`,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(and(dateFilter, sql`${activityLogs.userId} IS NOT NULL`))
      .groupBy(activityLogs.userId, users.name, users.image)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    // Top actions (for understanding what's happening)
    const topActions = await db
      .select({
        action: activityLogs.action,
        count: sql<number>`count(*)`,
      })
      .from(activityLogs)
      .where(dateFilter)
      .groupBy(activityLogs.action)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    return NextResponse.json({
      totalLogs,
      errorsToday: errorsToday[0]?.count || 0,
      warningsToday: warningsToday[0]?.count || 0,
      logsByDay,
      activityByCategory,
      levelDistribution,
      topUsers,
      topActions,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error fetching log stats", error);
    return NextResponse.json(
      { error: "Failed to fetch log stats" },
      { status: 500 }
    );
  }
}
