import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { worldLocations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";

// GET /api/world-locations - List world locations, optionally filtered by category
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    let query = db
      .select({
        id: worldLocations.id,
        category: worldLocations.category,
        name: worldLocations.name,
        nameDe: worldLocations.nameDe,
        nameEn: worldLocations.nameEn,
        nameSl: worldLocations.nameSl,
        latitude: worldLocations.latitude,
        longitude: worldLocations.longitude,
        countryCode: worldLocations.countryCode,
        difficulty: worldLocations.difficulty,
      })
      .from(worldLocations);

    if (category) {
      query = query.where(eq(worldLocations.category, category)) as typeof query;
    }

    const locations = await query.orderBy(worldLocations.name);

    return NextResponse.json(locations, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    logger.error("Error fetching world locations", error);
    return NextResponse.json({ error: "Failed to fetch world locations" }, { status: 500 });
  }
}

// POST /api/world-locations - Add a single world location
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { category, name, latitude, longitude, countryCode, difficulty = "medium" } = body;

    // Validate required fields
    if (!category || !name || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: category, name, latitude, longitude" },
        { status: 400 }
      );
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90) {
      return NextResponse.json({ error: "Invalid latitude" }, { status: 400 });
    }
    if (longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: "Invalid longitude" }, { status: 400 });
    }

    // Check for duplicate (same name in same category)
    const existing = await db
      .select()
      .from(worldLocations)
      .where(eq(worldLocations.category, category));

    const duplicate = existing.find(
      (loc) => loc.name.toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
      return NextResponse.json(
        { error: `Location "${name}" already exists in category "${category}"` },
        { status: 409 }
      );
    }

    await db.insert(worldLocations).values({
      category,
      name,
      latitude,
      longitude,
      countryCode: countryCode || null,
      difficulty,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error creating world location", error);
    return NextResponse.json({ error: "Failed to create world location" }, { status: 500 });
  }
}

// DELETE /api/world-locations?id=xxx - Delete a world location
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing location ID" }, { status: 400 });
    }

    await db.delete(worldLocations).where(eq(worldLocations.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting world location", error);
    return NextResponse.json({ error: "Failed to delete world location" }, { status: 500 });
  }
}
