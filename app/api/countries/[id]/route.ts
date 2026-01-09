import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { countries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/countries/[id] - Get single country
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const country = await db.select().from(countries).where(eq(countries.id, id));

    if (country.length === 0) {
      return NextResponse.json({ error: "Country not found" }, { status: 404 });
    }

    return NextResponse.json(country[0]);
  } catch (error) {
    logger.error("Error fetching country", error);
    return NextResponse.json({ error: "Failed to fetch country" }, { status: 500 });
  }
}

// PUT /api/countries/[id] - Update country
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await db.select().from(countries).where(eq(countries.id, id));
    if (existing.length === 0) {
      return NextResponse.json({ error: "Country not found" }, { status: 404 });
    }

    const {
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
      isActive,
    } = body;

    await db
      .update(countries)
      .set({
        ...(name !== undefined && { name }),
        ...(nameEn !== undefined && { nameEn }),
        ...(nameSl !== undefined && { nameSl }),
        ...(icon !== undefined && { icon }),
        ...(geoJsonData !== undefined && { geoJsonData }),
        ...(centerLat !== undefined && { centerLat }),
        ...(centerLng !== undefined && { centerLng }),
        ...(defaultZoom !== undefined && { defaultZoom }),
        ...(minZoom !== undefined && { minZoom }),
        ...(boundsNorth !== undefined && { boundsNorth }),
        ...(boundsSouth !== undefined && { boundsSouth }),
        ...(boundsEast !== undefined && { boundsEast }),
        ...(boundsWest !== undefined && { boundsWest }),
        ...(timeoutPenalty !== undefined && { timeoutPenalty }),
        ...(scoreScaleFactor !== undefined && { scoreScaleFactor }),
        ...(isActive !== undefined && { isActive }),
      })
      .where(eq(countries.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error updating country", error);
    return NextResponse.json({ error: "Failed to update country" }, { status: 500 });
  }
}

// DELETE /api/countries/[id] - Delete country
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await db.select().from(countries).where(eq(countries.id, id));
    if (existing.length === 0) {
      return NextResponse.json({ error: "Country not found" }, { status: 404 });
    }

    await db.delete(countries).where(eq(countries.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting country", error);
    return NextResponse.json({ error: "Failed to delete country" }, { status: 500 });
  }
}
