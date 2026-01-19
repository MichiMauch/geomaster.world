import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

const MAX_WIDTH = 1000;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "news");

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    // Validate inputs
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const uniqueId = nanoid(6);

    // Process with Sharp, convert to WebP
    const finalBuffer = await sharp(buffer)
      .resize(MAX_WIDTH, null, {
        withoutEnlargement: true,
        fit: "inside",
      })
      .webp({ quality: 85 })
      .toBuffer();

    const filename = `editor-${timestamp}-${uniqueId}.webp`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Write file
    await writeFile(filepath, finalBuffer);

    // Return the API path (dynamic serving for runtime uploads)
    const publicPath = `/api/uploads/news/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicPath,
    });
  } catch (error) {
    console.error("Error uploading news image:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
