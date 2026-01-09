import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { activityLogs, users } from "@/lib/db/schema";
import { eq, and, desc, lt, gte, sql, or, like } from "drizzle-orm";
import { NextResponse } from "next/server";
import { activityLogger } from "@/lib/activity-logger";

/**
 * GET /api/admin/logs
 * Fetch logs with filtering and pagination
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = (page - 1) * limit;

    // Filters
    const level = searchParams.get("level") as "debug" | "info" | "warn" | "error" | null;
    const category = searchParams.get("category") as "auth" | "game" | "admin" | "system" | null;
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    // Build conditions array
    const conditions = [];

    if (level) {
      conditions.push(eq(activityLogs.level, level));
    }

    if (category) {
      conditions.push(eq(activityLogs.category, category));
    }

    if (userId) {
      conditions.push(eq(activityLogs.userId, userId));
    }

    if (startDate) {
      conditions.push(gte(activityLogs.timestamp, new Date(startDate)));
    }

    if (endDate) {
      // Add one day to include the entire end date
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      conditions.push(lt(activityLogs.timestamp, end));
    }

    if (search) {
      conditions.push(
        or(
          like(activityLogs.action, `%${search}%`),
          like(activityLogs.details, `%${search}%`)
        )
      );
    }

    // Build where clause
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(activityLogs)
      .where(whereClause);
    const total = totalResult[0]?.count || 0;

    // Fetch logs with user info (left join)
    const logs = await db
      .select({
        id: activityLogs.id,
        timestamp: activityLogs.timestamp,
        level: activityLogs.level,
        category: activityLogs.category,
        action: activityLogs.action,
        userId: activityLogs.userId,
        targetId: activityLogs.targetId,
        targetType: activityLogs.targetType,
        details: activityLogs.details,
        metadata: activityLogs.metadata,
        userName: users.name,
        userImage: users.image,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(whereClause)
      .orderBy(desc(activityLogs.timestamp))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Error fetching logs", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/logs
 * Delete logs (by date or all)
 */
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { before, all } = body;

    let deleted = 0;

    if (all === true) {
      // Delete all logs
      const result = await db.delete(activityLogs);
      deleted = result.rowsAffected || 0;
    } else if (before) {
      // Delete logs before a certain date
      const beforeDate = new Date(before);
      const result = await db
        .delete(activityLogs)
        .where(lt(activityLogs.timestamp, beforeDate));
      deleted = result.rowsAffected || 0;
    } else {
      return NextResponse.json(
        { error: "Must specify 'before' date or 'all: true'" },
        { status: 400 }
      );
    }

    // Log this admin action
    await activityLogger.logAdmin(
      "logs.deleted",
      session.user.id!,
      "logs",
      "logs",
      { deleted, before: before || "all" }
    );

    return NextResponse.json({ deleted });
  } catch (error) {
    logger.error("Error deleting logs", error);
    return NextResponse.json(
      { error: "Failed to delete logs" },
      { status: 500 }
    );
  }
}
