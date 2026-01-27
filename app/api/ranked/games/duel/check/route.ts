import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { games } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * GET /api/ranked/games/duel/check?seed=...&gameType=...
 * Check if the current user has already played a duel with this seed.
 * Returns: { alreadyPlayed: boolean }
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ alreadyPlayed: false });
  }

  const { searchParams } = new URL(request.url);
  const seed = searchParams.get("seed");
  const gameType = searchParams.get("gameType");

  if (!seed || !gameType) {
    return NextResponse.json({ alreadyPlayed: false });
  }

  const existingGame = await db
    .select({ id: games.id })
    .from(games)
    .where(
      and(
        eq(games.duelSeed, seed),
        eq(games.userId, session.user.id),
        eq(games.mode, "duel")
      )
    )
    .get();

  return NextResponse.json({ alreadyPlayed: !!existingGame });
}
