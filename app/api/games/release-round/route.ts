import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { games, groups, groupMembers, locations, gameRounds } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { gameId } = body;

    if (!gameId) {
      return NextResponse.json(
        { error: "Game ID is required" },
        { status: 400 }
      );
    }

    // Get game
    const game = await db
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .get();

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Check if user is admin of the group
    const membership = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, game.groupId),
          eq(groupMembers.userId, session.user.id)
        )
      )
      .get();

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can release rounds" },
        { status: 403 }
      );
    }

    // Get group settings
    const group = await db
      .select()
      .from(groups)
      .where(eq(groups.id, game.groupId))
      .get();

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Get all locations (global)
    const allLocations = await db.select().from(locations);

    // Get locations already used in this game
    const usedRounds = await db
      .select({ locationId: gameRounds.locationId })
      .from(gameRounds)
      .where(eq(gameRounds.gameId, gameId));

    const usedLocationIds = new Set(usedRounds.map((r) => r.locationId));

    // Filter to available locations (not yet used)
    const availableLocations = allLocations.filter(
      (loc) => !usedLocationIds.has(loc.id)
    );

    // Check if we have enough locations for another round
    if (availableLocations.length < group.locationsPerRound) {
      return NextResponse.json(
        {
          error: `Nicht genügend unbenutzte Orte für eine weitere Runde. Benötigt: ${group.locationsPerRound}, Verfügbar: ${availableLocations.length}`,
        },
        { status: 400 }
      );
    }

    // Select random locations for the new round
    const shuffled = [...availableLocations].sort(() => Math.random() - 0.5);
    const selectedLocations = shuffled.slice(0, group.locationsPerRound);

    // Create the new round
    const newRoundNumber = game.currentRound + 1;

    // Prepare all gameRounds records for batch insert
    const gameRoundsToInsert = selectedLocations.map((loc, i) => ({
      id: nanoid(),
      gameId,
      roundNumber: newRoundNumber,
      locationIndex: i + 1,
      locationId: loc.id,
    }));

    // Batch insert all locations for the round
    await db.insert(gameRounds).values(gameRoundsToInsert);

    // Verify the correct number was inserted
    const insertedCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(gameRounds)
      .where(
        and(
          eq(gameRounds.gameId, gameId),
          eq(gameRounds.roundNumber, newRoundNumber)
        )
      )
      .get();

    if (insertedCount?.count !== group.locationsPerRound) {
      console.error(
        `Expected ${group.locationsPerRound} locations, but inserted ${insertedCount?.count}`
      );
      return NextResponse.json(
        { error: "Fehler beim Erstellen der Runde - nicht alle Orte wurden gespeichert" },
        { status: 500 }
      );
    }

    // Update currentRound
    await db
      .update(games)
      .set({ currentRound: newRoundNumber })
      .where(eq(games.id, gameId));

    return NextResponse.json({
      success: true,
      currentRound: newRoundNumber,
      locationsInRound: group.locationsPerRound,
    });
  } catch (error) {
    console.error("Error releasing round:", error);
    return NextResponse.json(
      { error: "Failed to release round" },
      { status: 500 }
    );
  }
}
