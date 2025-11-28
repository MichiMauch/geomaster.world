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
    const { locations: locationsToImport } = body;

    if (!Array.isArray(locationsToImport)) {
      return NextResponse.json(
        { error: "locations array required" },
        { status: 400 }
      );
    }

    // Validate all locations
    const errors: string[] = [];
    const validLocations: LocationImport[] = [];

    locationsToImport.forEach((loc: LocationImport, index: number) => {
      if (!loc.name || typeof loc.name !== "string") {
        errors.push(`Zeile ${index + 1}: Name fehlt`);
        return;
      }
      if (typeof loc.latitude !== "number" || loc.latitude < 45 || loc.latitude > 48) {
        errors.push(`Zeile ${index + 1}: Ungültiger Breitengrad (muss zwischen 45-48 sein)`);
        return;
      }
      if (typeof loc.longitude !== "number" || loc.longitude < 5 || loc.longitude > 11) {
        errors.push(`Zeile ${index + 1}: Ungültiger Längengrad (muss zwischen 5-11 sein)`);
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

    // Insert all locations
    const now = new Date();
    const insertedIds: string[] = [];

    for (const loc of validLocations) {
      const id = nanoid();
      await db.insert(locations).values({
        id,
        name: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
        difficulty: loc.difficulty || "medium",
        createdAt: now,
      });
      insertedIds.push(id);
    }

    return NextResponse.json({
      success: true,
      imported: insertedIds.length,
    });
  } catch (error) {
    console.error("Error importing locations:", error);
    return NextResponse.json(
      { error: "Failed to import locations" },
      { status: 500 }
    );
  }
}
