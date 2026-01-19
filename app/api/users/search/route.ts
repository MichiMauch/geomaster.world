import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ne, or, like, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDisplayName } from "@/lib/utils";

/**
 * GET /api/users/search?q=username
 * Search for users by name or nickname
 * Returns max 10 results, excluding the current user
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    // Search for users by name or nickname (case-insensitive)
    const searchPattern = `%${query}%`;

    const results = await db
      .select({
        id: users.id,
        name: users.name,
        nickname: users.nickname,
        image: users.image,
      })
      .from(users)
      .where(
        or(
          sql`LOWER(${users.name}) LIKE LOWER(${searchPattern})`,
          sql`LOWER(${users.nickname}) LIKE LOWER(${searchPattern})`
        )
      )
      .limit(10);

    // Exclude current user and transform results
    const filteredResults = results
      .filter((user) => user.id !== session.user.id)
      .map((user) => ({
        id: user.id,
        displayName: getDisplayName(user.name, user.nickname),
        image: user.image,
      }));

    return NextResponse.json(filteredResults);
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
