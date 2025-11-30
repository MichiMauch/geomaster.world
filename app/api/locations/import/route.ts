import { getServerSession } from "next-auth";
import { authOptions, isSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { locations } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

interface LocationImport {
  name: string;
  latitude: number;
  longitude: number;
  difficulty?: "easy" | "medium" | "hard";
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only super-admin can import locations
  if (!isSuperAdmin(session.user.email)) {
    return NextResponse.json(
      { error: "Only super-admin can import locations" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { locations: locationsToImport, country = "Switzerland" } = body;

    if (!Array.isArray(locationsToImport)) {
      return NextResponse.json(
        { error: "locations array required" },
        { status: 400 }
      );
    }

    // Get existing location names for duplicate check
    const existingLocations = await db.select({ name: locations.name }).from(locations);
    const existingNames = new Set(existingLocations.map(l => l.name.toLowerCase()));

    // Validate all locations
    const errors: string[] = [];
    const validLocations: LocationImport[] = [];
    const duplicates: string[] = [];

    locationsToImport.forEach((loc: LocationImport, index: number) => {
      if (!loc.name || typeof loc.name !== "string") {
        errors.push(`Zeile ${index + 1}: Name fehlt`);
        return;
      }

      // Check for duplicate
      if (existingNames.has(loc.name.toLowerCase())) {
        duplicates.push(loc.name);
        return;
      }

      if (typeof loc.latitude !== "number" || loc.latitude < -90 || loc.latitude > 90) {
        errors.push(`Zeile ${index + 1}: Ungültiger Breitengrad`);
        return;
      }
      if (typeof loc.longitude !== "number" || loc.longitude < -180 || loc.longitude > 180) {
        errors.push(`Zeile ${index + 1}: Ungültiger Längengrad`);
        return;
      }
      if (loc.difficulty && !["easy", "medium", "hard"].includes(loc.difficulty)) {
        errors.push(`Zeile ${index + 1}: Ungültige Schwierigkeit`);
        return;
      }
      validLocations.push(loc);
    });

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: errors },
        { status: 400 }
      );
    }

    // Insert all valid locations
    const now = new Date();
    const insertedIds: string[] = [];

    for (const loc of validLocations) {
      const id = nanoid();
      await db.insert(locations).values({
        id,
        name: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
        country,
        difficulty: loc.difficulty || "medium",
        createdAt: now,
      });
      insertedIds.push(id);
    }

    return NextResponse.json({
      success: true,
      imported: insertedIds.length,
      duplicatesSkipped: duplicates.length,
      duplicateNames: duplicates.slice(0, 10), // Return first 10 duplicate names
    });
  } catch (error) {
    console.error("Error importing locations:", error);
    return NextResponse.json(
      { error: "Failed to import locations" },
      { status: 500 }
    );
  }
}
