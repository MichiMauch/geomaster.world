import { db } from "@/lib/db";
import { countries, locations, worldLocations, worldQuizTypes } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export interface OverviewStats {
  countryCount: number;
  worldQuizCount: number;
  locationCount: number;
}

export async function GET() {
  try {
    // Count active countries from database
    const activeCountries = await db
      .select({ id: countries.id })
      .from(countries)
      .where(eq(countries.isActive, true));

    // Count total locations (regular locations)
    const locationCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(locations);

    // Count world locations
    const worldLocationCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(worldLocations);

    // Count active world quiz types from database
    const activeWorldQuizTypes = await db
      .select({ id: worldQuizTypes.id })
      .from(worldQuizTypes)
      .where(eq(worldQuizTypes.isActive, true));

    const worldQuizCount = activeWorldQuizTypes.length;

    const stats: OverviewStats = {
      countryCount: activeCountries.length,
      worldQuizCount: worldQuizCount,
      locationCount:
        Number(locationCountResult[0]?.count || 0) +
        Number(worldLocationCountResult[0]?.count || 0),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching overview stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
