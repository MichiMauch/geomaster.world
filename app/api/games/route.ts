import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  games,
  gameRounds,
  locations,
  groups,
  groupMembers,
  users,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

// Get current ISO week number
function getISOWeek(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");

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

    // Get user's hintEnabled setting
    const user = await db
      .select({ hintEnabled: users.hintEnabled })
      .from(users)
      .where(eq(users.id, session.user.id))
      .get();

    // Get current game with rounds
    const now = new Date();
    const currentWeek = getISOWeek(now);
    const currentYear = now.getFullYear();

    const game = await db
      .select()
      .from(games)
      .where(
        and(
          eq(games.groupId, groupId),
          eq(games.weekNumber, currentWeek),
          eq(games.year, currentYear)
        )
      )
      .orderBy(desc(games.createdAt))
      .get();

    if (!game) {
      return NextResponse.json({ game: null, rounds: [], timeLimitSeconds: null, hintEnabled: user?.hintEnabled ?? false });
    }

    // Get group settings for timeLimitSeconds
    const group = await db
      .select()
      .from(groups)
      .where(eq(groups.id, groupId))
      .get();

    // Get rounds with location info
    const rounds = await db
      .select({
        id: gameRounds.id,
        roundNumber: gameRounds.roundNumber,
        locationIndex: gameRounds.locationIndex,
        locationId: gameRounds.locationId,
        locationName: locations.name,
        latitude: locations.latitude,
        longitude: locations.longitude,
      })
      .from(gameRounds)
      .innerJoin(locations, eq(gameRounds.locationId, locations.id))
      .where(eq(gameRounds.gameId, game.id))
      .orderBy(gameRounds.roundNumber, gameRounds.locationIndex);

    return NextResponse.json({
      game,
      rounds,
      timeLimitSeconds: group?.timeLimitSeconds ?? null,
      hintEnabled: user?.hintEnabled ?? false
    });
  } catch (error) {
    console.error("Error fetching game:", error);
    return NextResponse.json(
      { error: "Failed to fetch game" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { groupId } = body;

    // Check if user is admin
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
      return NextResponse.json(
        { error: "Only admins can create games" },
        { status: 403 }
      );
    }

    // Get group settings
    const group = await db
      .select()
      .from(groups)
      .where(eq(groups.id, groupId))
      .get();

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Get available locations (global - all locations)
    const locationsList = await db.select().from(locations);

    if (locationsList.length < group.locationsPerRound) {
      return NextResponse.json(
        {
          error: `Mindestens ${group.locationsPerRound} Orte benötigt`,
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const currentWeek = getISOWeek(now);
    const currentYear = now.getFullYear();

    // Check if an ACTIVE game already exists for this week
    const existingActiveGame = await db
      .select()
      .from(games)
      .where(
        and(
          eq(games.groupId, groupId),
          eq(games.weekNumber, currentWeek),
          eq(games.year, currentYear),
          eq(games.status, "active")
        )
      )
      .get();

    if (existingActiveGame) {
      return NextResponse.json(
        { error: "Es gibt bereits ein aktives Spiel für diese Woche" },
        { status: 400 }
      );
    }

    // Create game
    const gameId = nanoid();
    await db.insert(games).values({
      id: gameId,
      groupId,
      weekNumber: currentWeek,
      year: currentYear,
      status: "active",
      createdAt: now,
    });

    // Select random locations for Round 1
    const shuffled = [...locationsList].sort(() => Math.random() - 0.5);
    const selectedLocations = shuffled.slice(0, group.locationsPerRound);

    // Prepare all gameRounds records for batch insert
    const gameRoundsToInsert = selectedLocations.map((loc, i) => ({
      id: nanoid(),
      gameId,
      roundNumber: 1,           // All locations belong to Round 1
      locationIndex: i + 1,     // Position within the round (1, 2, 3...)
      locationId: loc.id,
    }));

    // Batch insert all locations for Round 1
    await db.insert(gameRounds).values(gameRoundsToInsert);

    return NextResponse.json({ gameId });
  } catch (error) {
    console.error("Error creating game:", error);
    return NextResponse.json(
      { error: "Failed to create game" },
      { status: 500 }
    );
  }
}
