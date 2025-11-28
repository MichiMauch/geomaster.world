import { getServerSession } from "next-auth";
import { authOptions, isSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, groupMembers, guesses } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Get all users with group count and guess count
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        hintEnabled: users.hintEnabled,
        createdAt: sql<string>`COALESCE(${users.emailVerified}, datetime('now'))`,
        groupCount: sql<number>`(SELECT COUNT(*) FROM groupMembers WHERE groupMembers.userId = ${users.id})`,
        guessCount: sql<number>`(SELECT COUNT(*) FROM guesses WHERE guesses.userId = ${users.id})`,
      })
      .from(users)
      .orderBy(users.name);

    return NextResponse.json({ users: allUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
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
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Prevent deleting yourself
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete yourself" },
        { status: 400 }
      );
    }

    // Delete in order of foreign key constraints:
    // 1. Delete guesses
    await db.delete(guesses).where(eq(guesses.userId, userId));

    // 2. Delete group memberships
    await db.delete(groupMembers).where(eq(groupMembers.userId, userId));

    // 3. Delete the user
    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { userId, hintEnabled } = await request.json();

    if (!userId || typeof hintEnabled !== "boolean") {
      return NextResponse.json(
        { error: "User ID and hintEnabled are required" },
        { status: 400 }
      );
    }

    await db
      .update(users)
      .set({ hintEnabled })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user hint:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
