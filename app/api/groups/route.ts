import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { groups, groupMembers } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, locationsPerRound, timeLimitSeconds } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const groupId = nanoid();
    const inviteCode = nanoid(8);
    const now = new Date();

    // Create group
    await db.insert(groups).values({
      id: groupId,
      name,
      inviteCode,
      ownerId: session.user.id,
      locationsPerRound: locationsPerRound || 5,
      timeLimitSeconds: timeLimitSeconds || null,
      createdAt: now,
    });

    // Add creator as admin member
    await db.insert(groupMembers).values({
      groupId,
      userId: session.user.id,
      role: "admin",
      joinedAt: now,
    });

    return NextResponse.json({
      id: groupId,
      inviteCode,
    });
  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    );
  }
}
