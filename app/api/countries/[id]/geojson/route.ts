import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { countries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/countries/[id]/geojson - Get GeoJSON data for a country
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const country = await db
      .select({ geoJsonData: countries.geoJsonData })
      .from(countries)
      .where(eq(countries.id, id));

    if (country.length === 0) {
      return NextResponse.json({ error: "Country not found" }, { status: 404 });
    }

    if (!country[0].geoJsonData) {
      return NextResponse.json({ error: "No GeoJSON data available" }, { status: 404 });
    }

    // Parse and return the GeoJSON
    const geoJson = JSON.parse(country[0].geoJsonData);

    return NextResponse.json(geoJson, {
      headers: {
        "Content-Type": "application/geo+json",
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    });
  } catch (error) {
    logger.error("Error fetching GeoJSON", error);
    return NextResponse.json({ error: "Failed to fetch GeoJSON" }, { status: 500 });
  }
}
