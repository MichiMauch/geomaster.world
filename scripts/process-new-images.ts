/**
 * Process New Images Script
 *
 * Processes images from ~/Downloads/gmwimages/ and saves to public/uploads/countries/
 *
 * - Landmark images: Remove background (if API key present), convert to WebP 1000px
 * - Card/Background images: Convert to WebP 1000px, quality 85
 * - Flags: Copy as-is (GIF for animations)
 *
 * Usage: npx tsx scripts/process-new-images.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import sharp from "sharp";

const MAX_WIDTH = 1000;
const SOURCE_DIR = path.join(os.homedir(), "Downloads", "gmwimages");
const OUTPUT_DIR = path.join(process.cwd(), "public", "uploads", "countries");

// Image mappings: source filename -> { country, type }
const IMAGE_MAPPINGS: Record<string, { country: string; type: "landmark" | "card" | "background" | "flag" }> = {
  // Belgium
  "belgien-landmark.png": { country: "belgium", type: "landmark" },
  "belgien-map.png": { country: "belgium", type: "card" },
  "belgien-scenery.png": { country: "belgium", type: "background" },

  // Luxembourg
  "luxlandmark.png": { country: "luxembourg", type: "landmark" },
  "luxcard1.png": { country: "luxembourg", type: "card" },
  "lux-scenery.png": { country: "luxembourg", type: "background" },

  // Norway
  "norway-asset.jpg": { country: "norway", type: "landmark" },
  "norway-header-map.jpg": { country: "norway", type: "card" },
  "norway-scenery.jpg": { country: "norway", type: "background" },

  // United Kingdom
  "map-uk.jpg": { country: "united-kingdom", type: "card" },
  "uk-scenery.jpg": { country: "united-kingdom", type: "background" },
  "United-Kingdom-s.gif": { country: "united-kingdom", type: "flag" },
};

interface ProcessedImage {
  source: string;
  output: string;
  country: string;
  type: string;
  size: number;
}

async function removeBackground(buffer: Buffer, filename: string): Promise<Buffer> {
  if (!process.env.REMOVE_BG_API_KEY) {
    console.log(`   ⚠️  No REMOVE_BG_API_KEY, skipping background removal for ${filename}`);
    return buffer;
  }

  try {
    const removeBgForm = new FormData();
    // Convert Buffer to ArrayBuffer for Blob compatibility
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
    removeBgForm.append("image_file", new Blob([arrayBuffer]), filename);
    removeBgForm.append("size", "auto");

    const bgResponse = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": process.env.REMOVE_BG_API_KEY },
      body: removeBgForm,
    });

    if (bgResponse.ok) {
      console.log(`   ✓ Background removed for ${filename}`);
      return Buffer.from(await bgResponse.arrayBuffer());
    } else {
      const errorText = await bgResponse.text();
      console.log(`   ⚠️  remove.bg failed for ${filename}: ${bgResponse.status} - ${errorText}`);
      return buffer;
    }
  } catch (err) {
    console.log(`   ⚠️  remove.bg error for ${filename}: ${err}`);
    return buffer;
  }
}

async function processImages() {
  console.log("\n🖼️  Processing new images\n");
  console.log(`Source: ${SOURCE_DIR}`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Check source directory
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`❌ Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  const timestamp = Date.now();
  const processed: ProcessedImage[] = [];

  // Group by country for nicer output
  const byCountry: Record<string, string[]> = {};
  for (const [source, info] of Object.entries(IMAGE_MAPPINGS)) {
    if (!byCountry[info.country]) {
      byCountry[info.country] = [];
    }
    byCountry[info.country].push(source);
  }

  for (const [country, sources] of Object.entries(byCountry)) {
    console.log(`\n📁 ${country.toUpperCase()}`);
    console.log("─".repeat(40));

    for (const sourceFile of sources) {
      const sourcePath = path.join(SOURCE_DIR, sourceFile);
      const info = IMAGE_MAPPINGS[sourceFile];

      // Check if source exists
      if (!fs.existsSync(sourcePath)) {
        console.log(`   ⚠️  ${sourceFile} - NOT FOUND, skipping`);
        continue;
      }

      const sourceStats = fs.statSync(sourcePath);
      console.log(`   📄 ${sourceFile} (${(sourceStats.size / 1024 / 1024).toFixed(2)} MB)`);

      const buffer = fs.readFileSync(sourcePath);
      let outputFilename: string;
      let finalBuffer: Buffer;

      if (info.type === "flag") {
        // Flags: Keep original format
        const ext = path.extname(sourceFile).toLowerCase();
        outputFilename = `${info.country}-flag-${timestamp}${ext}`;
        finalBuffer = buffer;
        console.log(`      → ${outputFilename} (copied as-is)`);
      } else if (info.type === "landmark") {
        // Landmarks: Remove background, then convert to WebP
        console.log(`      ⏳ Removing background...`);
        const processedBuffer = await removeBackground(buffer, sourceFile);

        finalBuffer = await sharp(processedBuffer)
          .resize(MAX_WIDTH, null, { withoutEnlargement: true, fit: "inside" })
          .webp({ quality: 90, alphaQuality: 100 })
          .toBuffer();

        outputFilename = `${info.country}-landmark-${timestamp}.webp`;
        console.log(`      → ${outputFilename} (${(finalBuffer.length / 1024).toFixed(0)} KB)`);
      } else {
        // Card/Background: Convert to WebP
        finalBuffer = await sharp(buffer)
          .resize(MAX_WIDTH, null, { withoutEnlargement: true, fit: "inside" })
          .webp({ quality: 85 })
          .toBuffer();

        outputFilename = `${info.country}-${info.type}-${timestamp}.webp`;
        console.log(`      → ${outputFilename} (${(finalBuffer.length / 1024).toFixed(0)} KB)`);
      }

      // Write output file
      const outputPath = path.join(OUTPUT_DIR, outputFilename);
      fs.writeFileSync(outputPath, finalBuffer);

      processed.push({
        source: sourceFile,
        output: outputFilename,
        country: info.country,
        type: info.type,
        size: finalBuffer.length,
      });
    }
  }

  // Summary
  console.log("\n" + "═".repeat(60));
  console.log("✅ PROCESSING COMPLETE");
  console.log("═".repeat(60));

  console.log(`\n📊 Summary: ${processed.length} images processed\n`);

  // Group by country for SQL generation
  const sqlByCountry: Record<string, Record<string, string>> = {};
  for (const img of processed) {
    if (!sqlByCountry[img.country]) {
      sqlByCountry[img.country] = {};
    }
    const columnName = `${img.type}_image`;
    sqlByCountry[img.country][columnName] = `/api/uploads/countries/${img.output}`;
  }

  console.log("📝 SQL updates to run:\n");
  for (const [country, columns] of Object.entries(sqlByCountry)) {
    const sets = Object.entries(columns)
      .map(([col, val]) => `  ${col} = '${val}'`)
      .join(",\n");
    console.log(`UPDATE countries SET\n${sets}\nWHERE id = '${country}';\n`);
  }

  return processed;
}

// Main
processImages()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Processing failed:", err);
    process.exit(1);
  });
