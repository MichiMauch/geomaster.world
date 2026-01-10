import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { panoramaTypes, panoramaLocations } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TranslationService } from "@/lib/services/translation-service";
import { logger } from "@/lib/logger";

// GET /api/panorama-types - List all panorama types with location counts
// Optional query param: ?active=true to only get active types
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";

    let query = db
      .select({
        id: panoramaTypes.id,
        name: panoramaTypes.name,
        nameEn: panoramaTypes.nameEn,
        nameSl: panoramaTypes.nameSl,
        icon: panoramaTypes.icon,
        landmarkImage: panoramaTypes.landmarkImage,
        backgroundImage: panoramaTypes.backgroundImage,
        centerLat: panoramaTypes.centerLat,
        centerLng: panoramaTypes.centerLng,
        defaultZoom: panoramaTypes.defaultZoom,
        minZoom: panoramaTypes.minZoom,
        timeoutPenalty: panoramaTypes.timeoutPenalty,
        scoreScaleFactor: panoramaTypes.scoreScaleFactor,
        defaultTimeLimitSeconds: panoramaTypes.defaultTimeLimitSeconds,
        isActive: panoramaTypes.isActive,
        createdAt: panoramaTypes.createdAt,
      })
      .from(panoramaTypes);

    if (activeOnly) {
      query = query.where(eq(panoramaTypes.isActive, true)) as typeof query;
    }

    const allTypes = await query.orderBy(panoramaTypes.name);

    // Get total panorama location count
    const locationCount = await db
      .select({
        count: sql<number>`count(*)`.as("count"),
      })
      .from(panoramaLocations);

    const totalLocations = locationCount[0]?.count || 0;

    const typesWithCounts = allTypes.map((t) => ({
      ...t,
      locationCount: totalLocations, // All panorama types share the same locations for now
    }));

    return NextResponse.json(typesWithCounts);
  } catch (error) {
    logger.error("Error fetching panorama types", error);
    return NextResponse.json({ error: "Failed to fetch panorama types" }, { status: 500 });
  }
}

// POST /api/panorama-types - Create a new panorama type
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
      icon,
      centerLat = 20,
      centerLng = 0,
      defaultZoom = 2,
      minZoom = 1,
      timeoutPenalty = 5000,
      scoreScaleFactor = 3000,
      defaultTimeLimitSeconds = 60,
    } = body;

    // Validate required fields
    if (!id || !name || !icon) {
      return NextResponse.json(
        { error: "Missing required fields: id, name, icon" },
        { status: 400 }
      );
    }

    // Check if type already exists
    const existing = await db.select().from(panoramaTypes).where(eq(panoramaTypes.id, id));
    if (existing.length > 0) {
      return NextResponse.json({ error: "Panorama type with this ID already exists" }, { status: 409 });
    }

    // Auto-translate name (DE → EN, SL)
    let nameEn = name;
    let nameSl = name;

    try {
      const translations = await TranslationService.translateBatch([name]);
      if (translations.length > 0) {
        nameEn = translations[0].nameEn || name;
        nameSl = translations[0].nameSl || name;
      }
    } catch (translationError) {
      logger.error("Translation failed, using original name", translationError);
    }

    await db.insert(panoramaTypes).values({
      id,
      name,
      nameEn,
      nameSl,
      icon,
      centerLat,
      centerLng,
      defaultZoom,
      minZoom,
      timeoutPenalty,
      scoreScaleFactor,
      defaultTimeLimitSeconds,
      isActive: true,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id, nameEn, nameSl });
  } catch (error) {
    logger.error("Error creating panorama type", error);
    return NextResponse.json({ error: "Failed to create panorama type" }, { status: 500 });
  }
}
