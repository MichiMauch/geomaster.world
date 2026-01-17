import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import jwt from "jsonwebtoken";

const COLLAB_JWT_SECRET = process.env.COLLAB_JWT_SECRET;
if (!COLLAB_JWT_SECRET) {
  console.error("COLLAB_JWT_SECRET environment variable must be set");
}

// Predefined colors for user cursors
const CURSOR_COLORS = [
  "#6366f1", // indigo
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ef4444", // red
  "#14b8a6", // teal
];

function getUserColor(userId: string): string {
  // Generate consistent color based on user ID
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.isSuperAdmin) {
      return NextResponse.json(
        { error: "Only SuperAdmins can use collaboration" },
        { status: 403 }
      );
    }

    if (!COLLAB_JWT_SECRET) {
      return NextResponse.json(
        { error: "Collaboration not configured" },
        { status: 503 }
      );
    }

    const token = jwt.sign(
      {
        userId: session.user.id,
        userName: session.user.name || session.user.email?.split("@")[0] || "Anonymous",
        userColor: getUserColor(session.user.id),
        isSuperAdmin: true,
      },
      COLLAB_JWT_SECRET,
      { expiresIn: "24h" }
    );

    return NextResponse.json({
      token,
      serverUrl: process.env.COLLAB_SERVER_URL || "ws://localhost:1234",
    });
  } catch (error) {
    console.error("Error generating collab token:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
