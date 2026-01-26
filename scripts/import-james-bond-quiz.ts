/**
 * Import James Bond 007 Quiz
 *
 * Usage: source <(grep -E "^TURSO_" .env.local | sed 's/^/export /') && npx tsx scripts/import-james-bond-quiz.ts
 */

import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { nanoid } from "nanoid";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

interface BondLocation {
  id: number;
  film: string;
  location_name: string;
  briefing: string;
  hint: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface BondQuizData {
  quiz_title: string;
  description: string;
  locations: BondLocation[];
}

async function main() {
  console.log("🎬 Importing James Bond 007 Quiz...\n");

  // Read JSON file
  const jsonPath = "/Users/michaelmauch/Downloads/007.json";
  const data: BondQuizData = JSON.parse(readFileSync(jsonPath, "utf-8"));

  console.log(`Found ${data.locations.length} locations\n`);

  // 1. Create WorldQuizType
  console.log("Creating WorldQuizType...");

  const quizTypeId = "james-bond-007";
  const now = Math.floor(Date.now() / 1000);

  try {
    await client.execute({
      sql: `INSERT INTO worldQuizTypes (id, name, name_en, icon, center_lat, center_lng, default_zoom, min_zoom, timeout_penalty, score_scale_factor, is_active, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        quizTypeId,
        "James Bond, 007",
        "James Bond, 007",
        "🎬",
        20,  // centerLat
        0,   // centerLng
        2,   // defaultZoom
        1,   // minZoom
        5000, // timeoutPenalty
        3000, // scoreScaleFactor
        1,   // isActive
        now, // createdAt
      ],
    });
    console.log("✓ WorldQuizType created: james-bond-007\n");
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message?.includes("UNIQUE constraint failed") || err.message?.includes("already exists")) {
      console.log("⚠ WorldQuizType already exists, skipping...\n");
    } else {
      throw error;
    }
  }

  // 2. Import Locations
  console.log("Importing locations...");

  let imported = 0;
  let skipped = 0;

  for (const loc of data.locations) {
    // Format: film \n briefing \n location_name (newlines for proper display)
    const name = `${loc.film}\n${loc.briefing}\n${loc.location_name}`;
    const locationId = nanoid();

    try {
      await client.execute({
        sql: `INSERT INTO worldLocations (id, category, name, name_de, name_en, latitude, longitude, difficulty, createdAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          locationId,
          quizTypeId,
          name,      // name (German briefing)
          name,      // name_de
          null,      // name_en (will be translated later)
          loc.coordinates.lat,
          loc.coordinates.lng,
          "medium",
          now,
        ],
      });
      imported++;
      process.stdout.write(`\r  Imported: ${imported}/${data.locations.length}`);
    } catch (error: unknown) {
      const err = error as Error;
      if (err.message?.includes("UNIQUE constraint failed")) {
        skipped++;
      } else {
        console.error(`\nError importing ${loc.location_name}:`, err.message);
      }
    }
  }

  console.log(`\n\n✓ Import complete!`);
  console.log(`  - Imported: ${imported}`);
  console.log(`  - Skipped (duplicates): ${skipped}`);
  console.log(`\n🎯 Quiz available at: /de/guesser/world:james-bond-007`);
}

main().catch(console.error);
