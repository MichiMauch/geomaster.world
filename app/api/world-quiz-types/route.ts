import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { worldQuizTypes, worldLocations } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions, isSuperAdmin } from "@/lib/auth";
import { TranslationService } from "@/lib/services/translation-service";

// GET /api/world-quiz-types - List all world quiz types with location counts
// Optional query param: ?active=true to only get active types
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";

    let query = db
      .select({
        id: worldQuizTypes.id,
        name: worldQuizTypes.name,
        nameEn: worldQuizTypes.nameEn,
        nameSl: worldQuizTypes.nameSl,
        icon: worldQuizTypes.icon,
        centerLat: worldQuizTypes.centerLat,
        centerLng: worldQuizTypes.centerLng,
        defaultZoom: worldQuizTypes.defaultZoom,
        minZoom: worldQuizTypes.minZoom,
        timeoutPenalty: worldQuizTypes.timeoutPenalty,
        scoreScaleFactor: worldQuizTypes.scoreScaleFactor,
        isActive: worldQuizTypes.isActive,
        createdAt: worldQuizTypes.createdAt,
      })
      .from(worldQuizTypes);

    if (activeOnly) {
      query = query.where(eq(worldQuizTypes.isActive, true)) as typeof query;
    }

    const allTypes = await query.orderBy(worldQuizTypes.name);

    // Get location counts for each category
    const locationCounts = await db
      .select({
        category: worldLocations.category,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(worldLocations)
      .groupBy(worldLocations.category);

    const countMap = new Map(locationCounts.map((lc) => [lc.category, lc.count]));

    const typesWithCounts = allTypes.map((t) => ({
      ...t,
      locationCount: countMap.get(t.id) || 0,
    }));

    return NextResponse.json(typesWithCounts);
  } catch (error) {
    console.error("Error fetching world quiz types:", error);
    return NextResponse.json({ error: "Failed to fetch world quiz types" }, { status: 500 });
  }
}

// POST /api/world-quiz-types - Create a new world quiz type
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
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
    } = body;

    // Validate required fields
    if (!id || !name || !icon) {
      return NextResponse.json(
        { error: "Missing required fields: id, name, icon" },
        { status: 400 }
      );
    }

    // Check if type already exists
    const existing = await db.select().from(worldQuizTypes).where(eq(worldQuizTypes.id, id));
    if (existing.length > 0) {
      return NextResponse.json({ error: "World quiz type with this ID already exists" }, { status: 409 });
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
      console.error("Translation failed, using original name:", translationError);
      // Continue with original name if translation fails
    }

    await db.insert(worldQuizTypes).values({
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
      isActive: true,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id, nameEn, nameSl });
  } catch (error) {
    console.error("Error creating world quiz type:", error);
    return NextResponse.json({ error: "Failed to create world quiz type" }, { status: 500 });
  }
}
