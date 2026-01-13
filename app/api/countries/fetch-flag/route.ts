import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "images", "countries");

// Flag sources for animated GIFs
const FLAG_SOURCES = [
  // Flagpedia - high quality animated flags
  (iso: string) => `https://flagpedia.net/data/flags/w580/${iso.toLowerCase()}.gif`,
  // Flag CDN - static but good fallback
  (iso: string) => `https://flagcdn.com/w320/${iso.toLowerCase()}.png`,
];

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { countryId, isoCode } = body;

    if (!countryId) {
      return NextResponse.json({ error: "No countryId provided" }, { status: 400 });
    }
    if (!isoCode || isoCode.length !== 2) {
      return NextResponse.json({ error: "Invalid ISO code (must be 2 letters)" }, { status: 400 });
    }

    // Try to fetch from sources
    let flagBuffer: ArrayBuffer | null = null;
    let extension = "gif";

    for (const getUrl of FLAG_SOURCES) {
      const url = getUrl(isoCode);
      try {
        const response = await fetch(url);
        if (response.ok) {
          flagBuffer = await response.arrayBuffer();
          // Determine extension from URL
          extension = url.endsWith(".png") ? "png" : "gif";
          break;
        }
      } catch {
        // Try next source
        continue;
      }
    }

    if (!flagBuffer) {
      return NextResponse.json(
        { error: "Could not fetch flag from any source" },
        { status: 404 }
      );
    }

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Save file with timestamp for cache-busting
    const timestamp = Date.now();
    const filename = `${countryId}-flag-${timestamp}.${extension}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    await writeFile(filepath, Buffer.from(flagBuffer));

    // Return the public path
    const publicPath = `/images/countries/${filename}`;

    return NextResponse.json({
      success: true,
      path: publicPath,
      size: flagBuffer.byteLength,
    });
  } catch (error) {
    console.error("Error fetching flag:", error);
    return NextResponse.json(
      { error: "Failed to fetch flag" },
      { status: 500 }
    );
  }
}
