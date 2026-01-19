/**
 * Migrate Image Paths Script
 *
 * Updates database paths from /api/images/countries/ to /api/uploads/countries/
 * Also updates the new images for Belgium, Luxembourg, Norway, and UK.
 *
 * Usage: npx tsx scripts/migrate-image-paths.ts
 */

import * as fs from "fs";
import * as path from "path";

// Load environment variables from .env.local BEFORE importing db
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").replace(/^["']|["']$/g, "");
        process.env[key] = value;
      }
    }
  }
}

function replaceImagePath(path: string | null): string | null {
  if (!path) return null;
  return path.replace("/api/images/countries/", "/api/uploads/countries/");
}

async function migrateImagePaths() {
  // Dynamic import after env vars are loaded
  const { db } = await import("../lib/db");
  const { countries } = await import("../lib/db/schema");
  const { eq } = await import("drizzle-orm");

  console.log("\n🔄 Migrating image paths\n");

  // Step 1: Update all existing paths from /api/images/countries/ to /api/uploads/countries/
  console.log("📁 Step 1: Migrating /api/images/countries/ → /api/uploads/countries/\n");

  // Get all countries
  const allCountries = await db.select().from(countries);
  console.log(`   Found ${allCountries.length} countries`);

  let updatedCount = 0;
  for (const country of allCountries) {
    const updates: {
      flagImage?: string | null;
      cardImage?: string | null;
      backgroundImage?: string | null;
      landmarkImage?: string | null;
    } = {};

    let needsUpdate = false;

    if (country.flagImage?.includes("/api/images/countries/")) {
      updates.flagImage = replaceImagePath(country.flagImage);
      needsUpdate = true;
    }
    if (country.cardImage?.includes("/api/images/countries/")) {
      updates.cardImage = replaceImagePath(country.cardImage);
      needsUpdate = true;
    }
    if (country.backgroundImage?.includes("/api/images/countries/")) {
      updates.backgroundImage = replaceImagePath(country.backgroundImage);
      needsUpdate = true;
    }
    if (country.landmarkImage?.includes("/api/images/countries/")) {
      updates.landmarkImage = replaceImagePath(country.landmarkImage);
      needsUpdate = true;
    }

    if (needsUpdate) {
      await db.update(countries).set(updates).where(eq(countries.id, country.id));
      updatedCount++;
    }
  }

  console.log(`   ✓ Updated ${updatedCount} countries with old image paths`);

  // Step 2: Skip news image paths (news images are embedded in content HTML)
  console.log("\n📰 Step 2: News image paths\n");
  console.log("   ℹ️  News images are embedded in content HTML - manual review may be needed");

  // Step 3: Update new images for specific countries
  console.log("\n🖼️  Step 3: Updating new country images\n");

  const timestamp = 1768861394719; // From the processing script

  // Belgium
  await db
    .update(countries)
    .set({
      landmarkImage: `/api/uploads/countries/belgium-landmark-${timestamp}.webp`,
      cardImage: `/api/uploads/countries/belgium-card-${timestamp}.webp`,
      backgroundImage: `/api/uploads/countries/belgium-background-${timestamp}.webp`,
    })
    .where(eq(countries.id, "belgium"));
  console.log("   ✓ Belgium: landmark, card, background updated");

  // Luxembourg
  await db
    .update(countries)
    .set({
      landmarkImage: `/api/uploads/countries/luxembourg-landmark-${timestamp}.webp`,
      cardImage: `/api/uploads/countries/luxembourg-card-${timestamp}.webp`,
      backgroundImage: `/api/uploads/countries/luxembourg-background-${timestamp}.webp`,
    })
    .where(eq(countries.id, "luxembourg"));
  console.log("   ✓ Luxembourg: landmark, card, background updated");

  // Norway
  await db
    .update(countries)
    .set({
      landmarkImage: `/api/uploads/countries/norway-landmark-${timestamp}.webp`,
      cardImage: `/api/uploads/countries/norway-card-${timestamp}.webp`,
      backgroundImage: `/api/uploads/countries/norway-background-${timestamp}.webp`,
    })
    .where(eq(countries.id, "norway"));
  console.log("   ✓ Norway: landmark, card, background updated");

  // United Kingdom
  await db
    .update(countries)
    .set({
      cardImage: `/api/uploads/countries/united-kingdom-card-${timestamp}.webp`,
      backgroundImage: `/api/uploads/countries/united-kingdom-background-${timestamp}.webp`,
      flagImage: `/api/uploads/countries/united-kingdom-flag-${timestamp}.gif`,
    })
    .where(eq(countries.id, "united-kingdom"));
  console.log("   ✓ United Kingdom: card, background, flag updated");

  // Summary
  console.log("\n" + "═".repeat(60));
  console.log("✅ MIGRATION COMPLETE");
  console.log("═".repeat(60));

  // Verify by showing some updated records
  console.log("\n📊 Verification (sample records):\n");

  const sampleCountries = await db
    .select({
      id: countries.id,
      flagImage: countries.flagImage,
      cardImage: countries.cardImage,
    })
    .from(countries)
    .limit(5);

  for (const c of sampleCountries) {
    console.log(`   ${c.id}:`);
    console.log(`      flag: ${c.flagImage || "(none)"}`);
    console.log(`      card: ${c.cardImage || "(none)"}`);
  }
}

// Main
migrateImagePaths()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  });
