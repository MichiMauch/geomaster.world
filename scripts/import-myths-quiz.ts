/**
 * Import Myths, Monsters & Mysteries Quiz
 *
 * Usage: export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/import-myths-quiz.ts
 */

import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { nanoid } from "nanoid";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

interface MythLocation {
  id: number;
  name: string;
  briefing: string;
  hint: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface MythQuizData {
  quiz_title: string;
  description: string;
  locations: MythLocation[];
}

async function main() {
  console.log("🐉 Importing Myths, Monsters & Mysteries Quiz...\n");

  // Read JSON file
  const jsonPath = "/Users/michaelmauch/Downloads/007.json";
  const data: MythQuizData = JSON.parse(readFileSync(jsonPath, "utf-8"));

  console.log(`Found ${data.locations.length} locations\n`);

  // 1. Create WorldQuizType
  console.log("Creating WorldQuizType...");

  const quizTypeId = "myths-monsters";
  const now = Math.floor(Date.now() / 1000);

  try {
    await client.execute({
      sql: `INSERT INTO worldQuizTypes (id, name, name_en, icon, landmark_image, background_image, center_lat, center_lng, default_zoom, min_zoom, timeout_penalty, score_scale_factor, is_active, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        quizTypeId,
        "Mythen, Monster & Mysterien",
        "Myths, Monsters & Mysteries",
        "🐉",
        "/images/myth-landmark.webp",
        "/images/myth-scenery.webp",
        20,    // centerLat
        0,     // centerLng
        2,     // defaultZoom
        1,     // minZoom
        5000,  // timeoutPenalty
        3000,  // scoreScaleFactor
        1,     // isActive
        now,   // createdAt
      ],
    });
    console.log("✓ WorldQuizType created: myths-monsters\n");
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
    const name = `${loc.name}\n${loc.briefing}`;
    const locationId = nanoid();
    const additionalInfo = JSON.stringify({ hint: loc.hint });

    try {
      await client.execute({
        sql: `INSERT INTO worldLocations (id, category, name, name_de, name_en, latitude, longitude, difficulty, additionalInfo, createdAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          locationId,
          quizTypeId,
          name,
          name,
          null,
          loc.coordinates.lat,
          loc.coordinates.lng,
          "medium",
          additionalInfo,
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
        console.error(`\nError importing ${loc.name}:`, err.message);
      }
    }
  }

  console.log(`\n\n✓ Import complete!`);
  console.log(`  - Imported: ${imported}`);
  console.log(`  - Skipped (duplicates): ${skipped}`);
  console.log(`\n🐉 Quiz available at: /de/guesser/world:myths-monsters`);
}

main().catch(console.error);
