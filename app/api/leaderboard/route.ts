import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { guesses, gameRounds, games, groupMembers, users } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    const type = searchParams.get("type") || "weekly"; // weekly or alltime
    const gameId = searchParams.get("gameId"); // optional: specific game for history

    if (!groupId) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    // Check membership
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
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    if (type === "weekly") {
      // Get specific game by ID or current week's game
      let game;

      if (gameId) {
        // History mode: load specific game
        game = await db
          .select()
          .from(games)
          .where(
            and(
              eq(games.id, gameId),
              eq(games.groupId, groupId)
            )
          )
          .get();
      } else {
        // Normal mode: load current active game
        game = await db
          .select()
          .from(games)
          .where(
            and(
              eq(games.groupId, groupId),
              eq(games.status, "active")
            )
          )
          .orderBy(desc(games.createdAt))
          .get();
      }

      if (!game) {
        return NextResponse.json({ leaderboard: [], game: null });
      }

      // Get total rounds for this game
      const roundsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(gameRounds)
        .where(eq(gameRounds.gameId, game.id))
        .get();

      // Get leaderboard for this game with membership status
      const leaderboardRaw = await db
        .select({
          userId: guesses.userId,
          userName: users.name,
          userImage: users.image,
          totalDistance: sql<number>`sum(${guesses.distanceKm})`,
          roundsPlayed: sql<number>`count(${guesses.id})`,
        })
        .from(guesses)
        .innerJoin(gameRounds, eq(guesses.gameRoundId, gameRounds.id))
        .innerJoin(users, eq(guesses.userId, users.id))
        .where(eq(gameRounds.gameId, game.id))
        .groupBy(guesses.userId, users.name, users.image)
        .orderBy(sql`sum(${guesses.distanceKm}) asc`);

      // Check membership for each user
      const memberUserIds = await db
        .select({ userId: groupMembers.userId })
        .from(groupMembers)
        .where(eq(groupMembers.groupId, groupId));

      const memberSet = new Set(memberUserIds.map(m => m.userId));

      return NextResponse.json({
        leaderboard: leaderboardRaw.map((entry, index) => ({
          ...entry,
          rank: index + 1,
          completed: entry.roundsPlayed >= (roundsCount?.count || 0),
          isMember: memberSet.has(entry.userId),
        })),
        game: {
          ...game,
          totalRounds: roundsCount?.count || 0,
        },
        revealed: game.leaderboardRevealed || game.status === "completed",
      });
    } else {
      // All-time leaderboard (total distance across all games)
      const leaderboardRaw = await db
        .select({
          userId: guesses.userId,
          userName: users.name,
          userImage: users.image,
          totalDistance: sql<number>`sum(${guesses.distanceKm})`,
          totalGuesses: sql<number>`count(${guesses.id})`,
          gamesPlayed: sql<number>`count(DISTINCT ${games.id})`,
        })
        .from(guesses)
        .innerJoin(gameRounds, eq(guesses.gameRoundId, gameRounds.id))
        .innerJoin(games, eq(gameRounds.gameId, games.id))
        .innerJoin(users, eq(guesses.userId, users.id))
        .where(eq(games.groupId, groupId))
        .groupBy(guesses.userId, users.name, users.image)
        .orderBy(sql`sum(${guesses.distanceKm}) asc`); // Sort by total km

      // Check membership for each user
      const memberUserIds = await db
        .select({ userId: groupMembers.userId })
        .from(groupMembers)
        .where(eq(groupMembers.groupId, groupId));

      const memberSet = new Set(memberUserIds.map(m => m.userId));

      return NextResponse.json({
        leaderboard: leaderboardRaw.map((entry, index) => ({
          ...entry,
          rank: index + 1,
          isMember: memberSet.has(entry.userId),
        })),
      });
    }
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
