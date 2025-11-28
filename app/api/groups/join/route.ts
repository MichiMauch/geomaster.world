import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { groups, groupMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { inviteCode } = body;

    if (!inviteCode || typeof inviteCode !== "string") {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 }
      );
    }

    // Find group by invite code
    const group = await db
      .select()
      .from(groups)
      .where(eq(groups.inviteCode, inviteCode))
      .get();

    if (!group) {
      return NextResponse.json(
        { error: "Ungültiger Einladungscode" },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMembership = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, group.id),
          eq(groupMembers.userId, session.user.id)
        )
      )
      .get();

    if (existingMembership) {
      return NextResponse.json({ groupId: group.id });
    }

    // Add as member
    await db.insert(groupMembers).values({
      groupId: group.id,
      userId: session.user.id,
      role: "member",
      joinedAt: new Date(),
    });

    return NextResponse.json({ groupId: group.id });
  } catch (error) {
    console.error("Error joining group:", error);
    return NextResponse.json(
      { error: "Failed to join group" },
      { status: 500 }
    );
  }
}
