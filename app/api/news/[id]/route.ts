import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TranslationService } from "@/lib/services/translation-service";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/news/[id] - Get single news item
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const news = await db.select().from(newsItems).where(eq(newsItems.id, id));

    if (news.length === 0) {
      return NextResponse.json({ error: "News not found" }, { status: 404 });
    }

    return NextResponse.json(news[0]);
  } catch (error) {
    logger.error("Error fetching news item", error);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}

// PUT /api/news/[id] - Update news item
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await db.select().from(newsItems).where(eq(newsItems.id, id));
    if (existing.length === 0) {
      return NextResponse.json({ error: "News not found" }, { status: 404 });
    }

    const {
      title,
      titleEn,
      content,
      contentEn,
      link,
      linkText,
      linkTextEn,
    } = body;

    // Auto-translate German to English if not provided
    let finalTitleEn = titleEn;
    let finalContentEn = contentEn;
    let finalLinkTextEn = linkTextEn;

    if (title && !titleEn) {
      finalTitleEn = title;
    }
    if (content && !contentEn) {
      finalContentEn = content;
    }
    if (linkText && !linkTextEn) {
      finalLinkTextEn = linkText;
    }

    // Translate if we have German content without English
    if ((title && !titleEn) || (content && !contentEn)) {
      try {
        const textsToTranslate: string[] = [];
        if (title && !titleEn) textsToTranslate.push(title);
        if (content && !contentEn) textsToTranslate.push(content);
        if (linkText && !linkTextEn) textsToTranslate.push(linkText);

        if (textsToTranslate.length > 0) {
          const translations = await TranslationService.translateNewsContent(textsToTranslate);

          let idx = 0;
          if (title && !titleEn && translations[idx]) {
            finalTitleEn = translations[idx].english || title;
            idx++;
          }
          if (content && !contentEn && translations[idx]) {
            finalContentEn = translations[idx].english || content;
            idx++;
          }
          if (linkText && !linkTextEn && translations[idx]) {
            finalLinkTextEn = translations[idx].english || linkText;
          }
        }
      } catch (translationError) {
        logger.error("Translation failed, using original text", translationError);
      }
    }

    await db
      .update(newsItems)
      .set({
        ...(title !== undefined && { title }),
        ...(finalTitleEn !== undefined && { titleEn: finalTitleEn }),
        ...(content !== undefined && { content }),
        ...(finalContentEn !== undefined && { contentEn: finalContentEn }),
        ...(link !== undefined && { link }),
        ...(linkText !== undefined && { linkText }),
        ...(finalLinkTextEn !== undefined && { linkTextEn: finalLinkTextEn }),
      })
      .where(eq(newsItems.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error updating news", error);
    return NextResponse.json({ error: "Failed to update news" }, { status: 500 });
  }
}

// DELETE /api/news/[id] - Delete news item
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await db.select().from(newsItems).where(eq(newsItems.id, id));
    if (existing.length === 0) {
      return NextResponse.json({ error: "News not found" }, { status: 404 });
    }

    await db.delete(newsItems).where(eq(newsItems.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting news", error);
    return NextResponse.json({ error: "Failed to delete news" }, { status: 500 });
  }
}
