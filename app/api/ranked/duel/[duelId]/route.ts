import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { DuelService } from "@/lib/services/duel-service";

/**
 * GET /api/ranked/duel/[duelId]
 * Get a single duel result by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ duelId: string }> }
) {
  try {
    const { duelId } = await params;

    const duel = await DuelService.getDuelById(duelId);

    if (!duel) {
      return NextResponse.json(
        { error: "Duel not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(duel);
  } catch (error) {
    logger.error("Error fetching duel result", error);
    return NextResponse.json(
      { error: "Failed to fetch duel result" },
      { status: 500 }
    );
  }
}
