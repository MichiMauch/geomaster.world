import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_WIDTH = 1000;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "countries");

// Flag type - keep as GIF without processing
const FLAG_ALLOWED_TYPES = ["image/gif", "image/png", "image/webp"];

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
    const countryId = formData.get("countryId") as string | null;
    const imageType = formData.get("type") as "landmark" | "background" | "card" | "flag" | null;

    // Validate inputs
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!countryId) {
      return NextResponse.json({ error: "No countryId provided" }, { status: 400 });
    }
    if (!imageType || !["landmark", "background", "card", "flag"].includes(imageType)) {
      return NextResponse.json({ error: "Invalid image type" }, { status: 400 });
    }

    // Flag type has different allowed types
    const allowedTypes = imageType === "flag" ? FLAG_ALLOWED_TYPES : ALLOWED_TYPES;
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: imageType === "flag"
          ? "Invalid file type for flag. Allowed: GIF, PNG, WebP"
          : "Invalid file type. Allowed: JPG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    // Read file buffer
    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);

    // For landmark images: Remove background using remove.bg API
    if (imageType === "landmark" && process.env.REMOVE_BG_API_KEY) {
      try {
        const removeBgForm = new FormData();
        removeBgForm.append("image_file", new Blob([buffer]), file.name);
        removeBgForm.append("size", "auto");

        const bgResponse = await fetch("https://api.remove.bg/v1.0/removebg", {
          method: "POST",
          headers: { "X-Api-Key": process.env.REMOVE_BG_API_KEY },
          body: removeBgForm,
        });

        if (bgResponse.ok) {
          buffer = Buffer.from(await bgResponse.arrayBuffer());
        } else {
          console.warn("remove.bg failed, using original image:", await bgResponse.text());
        }
      } catch (err) {
        console.warn("remove.bg error, using original image:", err);
      }
    }

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Generate filename with timestamp for cache-busting
    const timestamp = Date.now();
    let filename: string;
    let finalBuffer: Buffer;

    if (imageType === "flag") {
      // Flags: Keep original format (GIF for animations)
      const ext = file.type === "image/gif" ? "gif" : file.type === "image/png" ? "png" : "webp";
      filename = `${countryId}-${imageType}-${timestamp}.${ext}`;
      finalBuffer = buffer;
    } else {
      // Other images: Process with Sharp, convert to WebP
      // For landmark images, preserve transparency with high alpha quality
      const webpOptions = imageType === "landmark"
        ? { quality: 90, alphaQuality: 100 }  // Preserve transparency for landmarks
        : { quality: 85 };

      finalBuffer = await sharp(buffer)
        .resize(MAX_WIDTH, null, {
          withoutEnlargement: true, // Don't upscale smaller images
          fit: "inside",
        })
        .webp(webpOptions)
        .toBuffer();

      filename = `${countryId}-${imageType}-${timestamp}.webp`;
    }

    const filepath = path.join(UPLOAD_DIR, filename);

    // Write file
    await writeFile(filepath, finalBuffer);

    // Return the API path (dynamic serving for runtime uploads)
    const publicPath = `/api/uploads/countries/${filename}`;

    return NextResponse.json({
      success: true,
      path: publicPath,
      size: finalBuffer.length,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
