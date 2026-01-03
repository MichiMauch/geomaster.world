import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { countries, locations } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/countries - List all countries with location counts
export async function GET() {
  try {
    const allCountries = await db
      .select({
        id: countries.id,
        name: countries.name,
        nameEn: countries.nameEn,
        nameSl: countries.nameSl,
        icon: countries.icon,
        centerLat: countries.centerLat,
        centerLng: countries.centerLng,
        defaultZoom: countries.defaultZoom,
        minZoom: countries.minZoom,
        boundsNorth: countries.boundsNorth,
        boundsSouth: countries.boundsSouth,
        boundsEast: countries.boundsEast,
        boundsWest: countries.boundsWest,
        timeoutPenalty: countries.timeoutPenalty,
        scoreScaleFactor: countries.scoreScaleFactor,
        isActive: countries.isActive,
        createdAt: countries.createdAt,
      })
      .from(countries)
      .orderBy(countries.name);

    // Get location counts for each country
    const locationCounts = await db
      .select({
        country: locations.country,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(locations)
      .groupBy(locations.country);

    const countMap = new Map(locationCounts.map((lc) => [lc.country, lc.count]));

    const countriesWithCounts = allCountries.map((c) => ({
      ...c,
      // Match country name (e.g., "Switzerland") to location.country field
      locationCount: countMap.get(c.nameEn || c.name) || 0,
    }));

    return NextResponse.json(countriesWithCounts);
  } catch (error) {
    console.error("Error fetching countries:", error);
    return NextResponse.json({ error: "Failed to fetch countries" }, { status: 500 });
  }
}

// POST /api/countries - Create a new country
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.email !== "michi.mauch@netnode.ch") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      name,
      nameEn,
      nameSl,
      icon,
      geoJsonData,
      centerLat,
      centerLng,
      defaultZoom = 8,
      minZoom = 7,
      boundsNorth,
      boundsSouth,
      boundsEast,
      boundsWest,
      timeoutPenalty = 300,
      scoreScaleFactor = 80,
    } = body;

    // Validate required fields
    if (!id || !name || !icon || !centerLat || !centerLng) {
      return NextResponse.json(
        { error: "Missing required fields: id, name, icon, centerLat, centerLng" },
        { status: 400 }
      );
    }

    // Check if country already exists
    const existing = await db.select().from(countries).where(eq(countries.id, id));
    if (existing.length > 0) {
      return NextResponse.json({ error: "Country with this ID already exists" }, { status: 409 });
    }

    await db.insert(countries).values({
      id,
      name,
      nameEn,
      nameSl,
      icon,
      geoJsonData,
      centerLat,
      centerLng,
      defaultZoom,
      minZoom,
      boundsNorth,
      boundsSouth,
      boundsEast,
      boundsWest,
      timeoutPenalty,
      scoreScaleFactor,
      isActive: true,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error creating country:", error);
    return NextResponse.json({ error: "Failed to create country" }, { status: 500 });
  }
}
