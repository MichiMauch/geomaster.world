import { getServerSession } from "next-auth";
import { authOptions, isSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { locations } from "@/lib/db/schema";
import { eq, and, or, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { TranslationService } from "@/lib/services/translation-service";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSuperAdmin(session.user.email)) {
    return NextResponse.json(
      { error: "Only super-admin can translate locations" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { country } = body;

    if (!country) {
      return NextResponse.json(
        { error: "Country is required" },
        { status: 400 }
      );
    }

    // Find all locations that need translation (any translation field is null/empty)
    const untranslatedLocations = await db
      .select({ id: locations.id, name: locations.name })
      .from(locations)
      .where(
        and(
          eq(locations.country, country),
          or(
            isNull(locations.nameDe),
            isNull(locations.nameEn),
            isNull(locations.nameSl)
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
            .update(locations)
            .set({
              nameDe: translation.nameDe,
              nameEn: translation.nameEn,
              nameSl: translation.nameSl,
            })
            .where(eq(locations.id, loc.id));
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
    console.error("Error translating locations:", error);

    // Handle rate limit errors specifically
    if (error instanceof Error && error.message.includes("rate_limit")) {
      return NextResponse.json(
        { error: "API rate limit erreicht. Bitte versuche es später erneut." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to translate locations" },
      { status: 500 }
    );
  }
}

// GET endpoint to check translation status for a country
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSuperAdmin(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country");

  if (!country) {
    return NextResponse.json({ error: "Country required" }, { status: 400 });
  }

  // Count untranslated locations
  const untranslated = await db
    .select({ id: locations.id })
    .from(locations)
    .where(
      and(
        eq(locations.country, country),
        or(
          isNull(locations.nameDe),
          isNull(locations.nameEn),
          isNull(locations.nameSl)
        )
      )
    );

  const total = await db
    .select({ id: locations.id })
    .from(locations)
    .where(eq(locations.country, country));

  return NextResponse.json({
    untranslatedCount: untranslated.length,
    totalCount: total.length,
    translatedCount: total.length - untranslated.length,
  });
}
