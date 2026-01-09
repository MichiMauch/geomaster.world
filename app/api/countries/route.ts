import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { countries, locations } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TranslationService } from "@/lib/services/translation-service";
import { logger } from "@/lib/logger";

// GET /api/countries - List all countries with location counts
// Optional query param: ?active=true to only get active countries
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";

    let query = db
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
      .from(countries);

    if (activeOnly) {
      query = query.where(eq(countries.isActive, true)) as typeof query;
    }

    const allCountries = await query.orderBy(countries.name);

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
    logger.error("Error fetching countries", error);
    return NextResponse.json({ error: "Failed to fetch countries" }, { status: 500 });
  }
}

// POST /api/countries - Create a new country
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperAdmin) {
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

    // Auto-translate name (DE → EN, SL) if not provided
    let finalNameEn = nameEn || name;
    let finalNameSl = nameSl || name;

    if (!nameEn || !nameSl) {
      try {
        const translations = await TranslationService.translateBatch([name]);
        if (translations.length > 0) {
          finalNameEn = translations[0].nameEn || name;
          finalNameSl = translations[0].nameSl || name;
        }
      } catch (translationError) {
        logger.error("Translation failed, using original name", translationError);
        // Continue with original name if translation fails
      }
    }

    await db.insert(countries).values({
      id,
      name,
      nameEn: finalNameEn,
      nameSl: finalNameSl,
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

    return NextResponse.json({ success: true, id, nameEn: finalNameEn, nameSl: finalNameSl });
  } catch (error) {
    logger.error("Error creating country", error);
    return NextResponse.json({ error: "Failed to create country" }, { status: 500 });
  }
}
