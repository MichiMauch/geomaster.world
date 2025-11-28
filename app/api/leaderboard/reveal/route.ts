import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { games, groupMembers } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await request.json();
  if (!groupId) {
    return NextResponse.json({ error: "groupId required" }, { status: 400 });
  }

  // Check if user is admin of the group
  const membership = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, session.user.id)
      )
    )
    .get();

  if (!membership || membership.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Get current game
  const currentGame = await db
    .select()
    .from(games)
    .where(eq(games.groupId, groupId))
    .orderBy(desc(games.createdAt))
    .get();

  if (!currentGame) {
    return NextResponse.json({ error: "No game found" }, { status: 404 });
  }

  // Set leaderboardRevealed to true
  await db
    .update(games)
    .set({ leaderboardRevealed: true })
    .where(eq(games.id, currentGame.id));

  return NextResponse.json({ success: true, revealed: true });
}
