import { getServerSession } from "next-auth";
import { authOptions, isSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { locations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only super-admin can view locations
  if (!isSuperAdmin(session.user.email)) {
    return NextResponse.json(
      { error: "Only super-admin can view locations" },
      { status: 403 }
    );
  }

  try {
    const locationsList = await db.select().from(locations);

    return NextResponse.json(locationsList);
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only super-admin can add locations
  if (!isSuperAdmin(session.user.email)) {
    return NextResponse.json(
      { error: "Only super-admin can add locations" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { name, latitude, longitude, difficulty } = body;

    const locationId = nanoid();

    await db.insert(locations).values({
      id: locationId,
      name,
      latitude,
      longitude,
      difficulty: difficulty || "medium",
      createdAt: new Date(),
    });

    return NextResponse.json({ id: locationId });
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only super-admin can delete locations
  if (!isSuperAdmin(session.user.email)) {
    return NextResponse.json(
      { error: "Only super-admin can delete locations" },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("id");

    if (!locationId) {
      return NextResponse.json(
        { error: "Location ID is required" },
        { status: 400 }
      );
    }

    await db.delete(locations).where(eq(locations.id, locationId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting location:", error);
    return NextResponse.json(
      { error: "Failed to delete location" },
      { status: 500 }
    );
  }
}
