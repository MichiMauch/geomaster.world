import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsItems } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TranslationService } from "@/lib/services/translation-service";
import { logger } from "@/lib/logger";

// GET /api/news - List all news items (newest first)
// Optional query params: ?limit=3 to limit results
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    let query = db.select().from(newsItems).orderBy(desc(newsItems.createdAt));

    if (limit && limit > 0) {
      query = query.limit(limit) as typeof query;
    }

    const allNews = await query;

    return NextResponse.json(allNews, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    logger.error("Error fetching news", error);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}

// POST /api/news - Create a new news item
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      titleEn,
      content,
      contentEn,
      link,
      linkText,
      linkTextEn,
    } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: "Missing required fields: title, content" },
        { status: 400 }
      );
    }

    // Auto-translate German to English if not provided
    let finalTitleEn = titleEn || title;
    let finalContentEn = contentEn || content;
    let finalLinkTextEn = linkTextEn || linkText;

    if (!titleEn || !contentEn) {
      try {
        const textsToTranslate = [title, content];
        if (linkText && !linkTextEn) {
          textsToTranslate.push(linkText);
        }

        const translations = await TranslationService.translateNewsContent(textsToTranslate);

        if (translations.length >= 2) {
          finalTitleEn = titleEn || translations[0].english || title;
          finalContentEn = contentEn || translations[1].english || content;

          if (translations.length >= 3 && linkText) {
            finalLinkTextEn = linkTextEn || translations[2].english || linkText;
          }
        }
      } catch (translationError) {
        logger.error("Translation failed, using original text", translationError);
      }
    }

    const result = await db.insert(newsItems).values({
      title,
      titleEn: finalTitleEn,
      content,
      contentEn: finalContentEn,
      link: link || null,
      linkText: linkText || null,
      linkTextEn: finalLinkTextEn || null,
      createdAt: new Date(),
    }).returning({ id: newsItems.id });

    return NextResponse.json({
      success: true,
      id: result[0].id,
      titleEn: finalTitleEn,
    });
  } catch (error) {
    logger.error("Error creating news", error);
    return NextResponse.json({ error: "Failed to create news" }, { status: 500 });
  }
}
