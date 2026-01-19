import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { NotificationService } from "@/lib/services/notification-service";

/**
 * POST /api/notifications/[notificationId]/read - Mark a notification as read
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { notificationId } = await params;

    await NotificationService.markAsRead(notificationId, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}
