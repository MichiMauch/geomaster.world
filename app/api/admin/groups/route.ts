import { getServerSession } from "next-auth";
import { authOptions, isSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { groups, groupMembers, games, gameRounds, guesses } from "@/lib/db/schema";
import { eq, sql, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Get all groups with member count and game count
    const allGroups = await db
      .select({
        id: groups.id,
        name: groups.name,
        inviteCode: groups.inviteCode,
        createdAt: groups.createdAt,
        memberCount: sql<number>`(SELECT COUNT(*) FROM groupMembers WHERE groupMembers.groupId = ${groups.id})`,
        gameCount: sql<number>`(SELECT COUNT(*) FROM games WHERE games.groupId = ${groups.id})`,
      })
      .from(groups)
      .orderBy(groups.name);

    return NextResponse.json({ groups: allGroups });
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { groupId } = await request.json();

    if (!groupId) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    // Get all game IDs for this group
    const groupGames = await db
      .select({ id: games.id })
      .from(games)
      .where(eq(games.groupId, groupId));

    const gameIds = groupGames.map((g) => g.id);

    if (gameIds.length > 0) {
      // Get all gameRound IDs for these games
      const rounds = await db
        .select({ id: gameRounds.id })
        .from(gameRounds)
        .where(inArray(gameRounds.gameId, gameIds));

      const roundIds = rounds.map((r) => r.id);

      if (roundIds.length > 0) {
        // Delete guesses for these rounds
        await db.delete(guesses).where(inArray(guesses.gameRoundId, roundIds));
      }

      // Delete game rounds
      await db.delete(gameRounds).where(inArray(gameRounds.gameId, gameIds));

      // Delete games
      await db.delete(games).where(eq(games.groupId, groupId));
    }

    // Locations are now global - don't delete them with the group

    // Delete group members
    await db.delete(groupMembers).where(eq(groupMembers.groupId, groupId));

    // Delete the group
    await db.delete(groups).where(eq(groups.id, groupId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting group:", error);
    return NextResponse.json(
      { error: "Failed to delete group" },
      { status: 500 }
    );
  }
}
