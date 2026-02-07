import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { horizonItems } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const items = await db.select().from(horizonItems).all();

    return NextResponse.json(
      { items },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    logger.error("Error fetching horizon items", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}
