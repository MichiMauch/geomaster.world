import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { locations } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only super-admin can view locations
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json(
      { error: "Only super-admin can view locations" },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country");

    let locationsList;
    if (country) {
      locationsList = await db.select().from(locations).where(eq(locations.country, country));
    } else {
      locationsList = await db.select().from(locations);
    }

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
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json(
      { error: "Only super-admin can add locations" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { name, latitude, longitude, difficulty, country = "Switzerland" } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name ist erforderlich" },
        { status: 400 }
      );
    }

    if (typeof latitude !== "number" || latitude < -90 || latitude > 90) {
      return NextResponse.json(
        { error: "Ungültiger Breitengrad (muss zwischen -90 und 90 liegen)" },
        { status: 400 }
      );
    }

    if (typeof longitude !== "number" || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: "Ungültiger Längengrad (muss zwischen -180 und 180 liegen)" },
        { status: 400 }
      );
    }

    // Check for duplicate: case-insensitive, per country
    const existing = await db.select({ id: locations.id })
      .from(locations)
      .where(
        and(
          sql`LOWER(${locations.name}) = LOWER(${name.trim()})`,
          eq(locations.country, country)
        )
      );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `Ort "${name}" existiert bereits in diesem Land` },
        { status: 409 }
      );
    }

    const locationId = nanoid();

    await db.insert(locations).values({
      id: locationId,
      name: name.trim(),
      latitude,
      longitude,
      country,
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
  if (!session?.user?.isSuperAdmin) {
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
