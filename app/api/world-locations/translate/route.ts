import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { worldLocations } from "@/lib/db/schema";
import { eq, and, or, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { TranslationService } from "@/lib/services/translation-service";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json(
      { error: "Only super-admin can translate locations" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { category } = body;

    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    // Find all world locations that need translation (any translation field is null/empty)
    const untranslatedLocations = await db
      .select({ id: worldLocations.id, name: worldLocations.name })
      .from(worldLocations)
      .where(
        and(
          eq(worldLocations.category, category),
          or(
            isNull(worldLocations.nameDe),
            isNull(worldLocations.nameEn),
            isNull(worldLocations.nameSl)
          )
        )
      );

    if (untranslatedLocations.length === 0) {
      return NextResponse.json({
        success: true,
        translated: 0,
        message: "Alle Orte sind bereits übersetzt",
      });
    }

    // Extract names for translation
    const names = untranslatedLocations.map((loc) => loc.name);

    // Translate using GPT
    const translations = await TranslationService.translateBatch(names);

    // Create a map for quick lookup
    const translationMap = new Map(
      translations.map((t) => [t.original.toLowerCase(), t])
    );

    // Update database with translations
    let translated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const loc of untranslatedLocations) {
      const translation = translationMap.get(loc.name.toLowerCase());

      if (translation) {
        try {
          await db
            .update(worldLocations)
            .set({
              nameDe: translation.nameDe,
              nameEn: translation.nameEn,
              nameSl: translation.nameSl,
            })
            .where(eq(worldLocations.id, loc.id));
          translated++;
        } catch (err) {
          failed++;
          errors.push(`Failed to update ${loc.name}: ${err}`);
        }
      } else {
        failed++;
        errors.push(`No translation found for: ${loc.name}`);
      }
    }

    return NextResponse.json({
      success: true,
      translated,
      failed,
      total: untranslatedLocations.length,
      errors: errors.slice(0, 10), // Return first 10 errors
    });
  } catch (error) {
    logger.error("Error translating world locations", error);

    // Handle rate limit errors specifically
    if (error instanceof Error && error.message.includes("rate_limit")) {
      return NextResponse.json(
        { error: "API rate limit erreicht. Bitte versuche es später erneut." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to translate world locations" },
      { status: 500 }
    );
  }
}

// GET endpoint to check translation status for a category
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  if (!category) {
    return NextResponse.json({ error: "Category required" }, { status: 400 });
  }

  // Count untranslated locations
  const untranslated = await db
    .select({ id: worldLocations.id })
    .from(worldLocations)
    .where(
      and(
        eq(worldLocations.category, category),
        or(
          isNull(worldLocations.nameDe),
          isNull(worldLocations.nameEn),
          isNull(worldLocations.nameSl)
        )
      )
    );

  const total = await db
    .select({ id: worldLocations.id })
    .from(worldLocations)
    .where(eq(worldLocations.category, category));

  return NextResponse.json({
    untranslatedCount: untranslated.length,
    totalCount: total.length,
    translatedCount: total.length - untranslated.length,
  });
}
