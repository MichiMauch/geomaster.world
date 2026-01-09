import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { groups, groupMembers, games, gameRounds, guesses } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { groupId } = await request.json();

    if (!groupId) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    // Check if user is member of the group
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

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this group" },
        { status: 403 }
      );
    }

    // Check if user is the owner of the group
    const group = await db
      .select()
      .from(groups)
      .where(eq(groups.id, groupId))
      .get();

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    const isOwner = group.ownerId === session.user.id;

    if (isOwner) {
      // Owner leaves = Delete entire group (cascade delete)
      const groupGames = await db
        .select({ id: games.id })
        .from(games)
        .where(eq(games.groupId, groupId));

      const gameIds = groupGames.map((g) => g.id);

      if (gameIds.length > 0) {
        const rounds = await db
          .select({ id: gameRounds.id })
          .from(gameRounds)
          .where(inArray(gameRounds.gameId, gameIds));

        const roundIds = rounds.map((r) => r.id);

        if (roundIds.length > 0) {
          await db.delete(guesses).where(inArray(guesses.gameRoundId, roundIds));
        }

        await db.delete(gameRounds).where(inArray(gameRounds.gameId, gameIds));
        await db.delete(games).where(eq(games.groupId, groupId));
      }

      // Locations are now global - don't delete them with the group
      await db.delete(groupMembers).where(eq(groupMembers.groupId, groupId));
      await db.delete(groups).where(eq(groups.id, groupId));

      return NextResponse.json({ success: true, deleted: true });
    } else {
      // Normal member leaves = Just remove from groupMembers (keep guesses)
      await db
        .delete(groupMembers)
        .where(
          and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, session.user.id)
          )
        );

      return NextResponse.json({ success: true, deleted: false });
    }
  } catch (error) {
    logger.error("Error leaving group", error);
    return NextResponse.json(
      { error: "Failed to leave group" },
      { status: 500 }
    );
  }
}
