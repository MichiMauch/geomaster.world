import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { locations } from "@/lib/db/schema";
import { NextResponse } from "next/server";
import { getLocalizedName } from "@/lib/location-utils";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get locale from query param or Accept-Language header, default to "de"
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") ||
      request.headers.get("Accept-Language")?.split(",")[0]?.split("-")[0] ||
      "de";

    const locationsList = await db.select().from(locations);

    // Return locations with localized names
    const localizedLocations = locationsList.map(loc => ({
      ...loc,
      name: getLocalizedName(loc, locale),
    }));

    return NextResponse.json(localizedLocations);
  } catch (error) {
    logger.error("Error fetching locations", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}
