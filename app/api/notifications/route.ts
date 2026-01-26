import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { NotificationService } from "@/lib/services/notification-service";
import { withRetry } from "@/lib/db/retry";

/**
 * GET /api/notifications - Get notifications for logged-in user
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
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const [notifications, unreadCount] = await Promise.all([
      withRetry(
        () => NotificationService.getForUser({
          userId: session.user.id,
          limit,
          offset,
          unreadOnly,
        }),
        "get_notifications"
      ),
      withRetry(
        () => NotificationService.getUnreadCount(session.user.id),
        "get_unread_count"
      ),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      hasMore: notifications.length === limit,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications - Mark all notifications as read
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const count = await withRetry(
      () => NotificationService.markAllAsRead(session.user.id),
      "mark_all_read"
    );
    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}
