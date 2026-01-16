import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const IMAGES_DIR = path.join(process.cwd(), "public", "images");

// MIME types for common image formats
const MIME_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const imagePath = pathSegments.join("/");

    // Security: prevent directory traversal
    if (imagePath.includes("..")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const fullPath = path.join(IMAGES_DIR, imagePath);

    // Ensure the path is within IMAGES_DIR
    if (!fullPath.startsWith(IMAGES_DIR)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const ext = path.extname(fullPath).toLowerCase();
    const mimeType = MIME_TYPES[ext] || "application/octet-stream";

    const fileBuffer = await readFile(fullPath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    // File not found or read error
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
}
