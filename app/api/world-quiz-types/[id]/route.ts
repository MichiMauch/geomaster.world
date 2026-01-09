import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { worldQuizTypes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/world-quiz-types/[id] - Get single world quiz type
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const quizType = await db.select().from(worldQuizTypes).where(eq(worldQuizTypes.id, id));

    if (quizType.length === 0) {
      return NextResponse.json({ error: "World quiz type not found" }, { status: 404 });
    }

    return NextResponse.json(quizType[0]);
  } catch (error) {
    logger.error("Error fetching world quiz type", error);
    return NextResponse.json({ error: "Failed to fetch world quiz type" }, { status: 500 });
  }
}

// PUT /api/world-quiz-types/[id] - Update world quiz type
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await db.select().from(worldQuizTypes).where(eq(worldQuizTypes.id, id));
    if (existing.length === 0) {
      return NextResponse.json({ error: "World quiz type not found" }, { status: 404 });
    }

    const {
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
      isActive,
    } = body;

    await db
      .update(worldQuizTypes)
      .set({
        ...(name !== undefined && { name }),
        ...(nameEn !== undefined && { nameEn }),
        ...(nameSl !== undefined && { nameSl }),
        ...(icon !== undefined && { icon }),
        ...(centerLat !== undefined && { centerLat }),
        ...(centerLng !== undefined && { centerLng }),
        ...(defaultZoom !== undefined && { defaultZoom }),
        ...(minZoom !== undefined && { minZoom }),
        ...(timeoutPenalty !== undefined && { timeoutPenalty }),
        ...(scoreScaleFactor !== undefined && { scoreScaleFactor }),
        ...(isActive !== undefined && { isActive }),
      })
      .where(eq(worldQuizTypes.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error updating world quiz type", error);
    return NextResponse.json({ error: "Failed to update world quiz type" }, { status: 500 });
  }
}

// DELETE /api/world-quiz-types/[id] - Delete world quiz type
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await db.select().from(worldQuizTypes).where(eq(worldQuizTypes.id, id));
    if (existing.length === 0) {
      return NextResponse.json({ error: "World quiz type not found" }, { status: 404 });
    }

    await db.delete(worldQuizTypes).where(eq(worldQuizTypes.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting world quiz type", error);
    return NextResponse.json({ error: "Failed to delete world quiz type" }, { status: 500 });
  }
}
