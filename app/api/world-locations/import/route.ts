import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { worldLocations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface ImportLocation {
  name: string;
  latitude: number;
  longitude: number;
  countryCode?: string;
  difficulty?: string;
}

// POST /api/world-locations/import - Batch import world locations
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { locations: locationsData, category } = body;

    if (!category) {
      return NextResponse.json({ error: "Missing category" }, { status: 400 });
    }

    if (!Array.isArray(locationsData) || locationsData.length === 0) {
      return NextResponse.json({ error: "No locations provided" }, { status: 400 });
    }

    // Validate all locations first
    const validationErrors: string[] = [];
    locationsData.forEach((loc: ImportLocation, index: number) => {
      if (!loc.name) {
        validationErrors.push(`Row ${index + 1}: Missing name`);
      }
      if (loc.latitude === undefined || loc.latitude < -90 || loc.latitude > 90) {
        validationErrors.push(`Row ${index + 1}: Invalid latitude`);
      }
      if (loc.longitude === undefined || loc.longitude < -180 || loc.longitude > 180) {
        validationErrors.push(`Row ${index + 1}: Invalid longitude`);
      }
      if (loc.difficulty && !["easy", "medium", "hard"].includes(loc.difficulty)) {
        validationErrors.push(`Row ${index + 1}: Invalid difficulty (must be easy, medium, or hard)`);
      }
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    // Get existing locations for this category (for duplicate check)
    const existing = await db
      .select()
      .from(worldLocations)
      .where(eq(worldLocations.category, category));

    const existingNames = new Set(existing.map((loc) => loc.name.toLowerCase()));

    // Filter out duplicates and prepare for insert
    const duplicateNames: string[] = [];
    const toInsert: Array<{
      category: string;
      name: string;
      latitude: number;
      longitude: number;
      countryCode: string | null;
      difficulty: "easy" | "medium" | "hard";
      createdAt: Date;
    }> = [];

    for (const loc of locationsData as ImportLocation[]) {
      if (existingNames.has(loc.name.toLowerCase())) {
        duplicateNames.push(loc.name);
      } else {
        toInsert.push({
          category,
          name: loc.name,
          latitude: loc.latitude,
          longitude: loc.longitude,
          countryCode: loc.countryCode || null,
          difficulty: (loc.difficulty as "easy" | "medium" | "hard") || "medium",
          createdAt: new Date(),
        });
        // Add to set to prevent duplicates within the same import
        existingNames.add(loc.name.toLowerCase());
      }
    }

    // Insert all valid locations
    if (toInsert.length > 0) {
      await db.insert(worldLocations).values(toInsert);
    }

    return NextResponse.json({
      success: true,
      imported: toInsert.length,
      duplicatesSkipped: duplicateNames.length,
      duplicateNames: duplicateNames.slice(0, 10), // Only return first 10 duplicate names
    });
  } catch (error) {
    console.error("Error importing world locations:", error);
    return NextResponse.json({ error: "Failed to import world locations" }, { status: 500 });
  }
}
