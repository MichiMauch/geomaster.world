/**
 * Script to seed country quiz types into worldQuizTypes table
 *
 * These are quiz categories where the user must click on the correct country.
 * Unlike regular world quizzes where you pinpoint an exact location,
 * these quizzes check if your click is inside the correct country polygon.
 *
 * Run with: npx tsx scripts/seed-country-quiz-types.ts
 */

import { db } from "../lib/db";
import { worldQuizTypes } from "../lib/db/schema";
import { eq } from "drizzle-orm";

const COUNTRY_QUIZ_TYPES = [
  {
    id: "country-flags",
    name: "Länderflaggen",
    nameEn: "Country Flags",
    nameSl: "Državne zastave",
    icon: "🏴",
    centerLat: 20,
    centerLng: 0,
    defaultZoom: 2,
    minZoom: 1,
    timeoutPenalty: 5000,
    scoreScaleFactor: 3000,
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "place-names",
    name: "Ortsnamen",
    nameEn: "Place Names",
    nameSl: "Imena krajev",
    icon: "📍",
    centerLat: 20,
    centerLng: 0,
    defaultZoom: 2,
    minZoom: 1,
    timeoutPenalty: 5000,
    scoreScaleFactor: 3000,
    isActive: true,
    createdAt: new Date(),
  },
];

async function main() {
  console.log("🌍 Seeding country quiz types...\n");

  for (const quizType of COUNTRY_QUIZ_TYPES) {
    // Check if already exists
    const existing = await db
      .select()
      .from(worldQuizTypes)
      .where(eq(worldQuizTypes.id, quizType.id));

    if (existing.length > 0) {
      console.log(`⏭️  ${quizType.id}: Already exists, skipping`);
      continue;
    }

    await db.insert(worldQuizTypes).values(quizType);
    console.log(`✅ ${quizType.id}: Created "${quizType.name}" (${quizType.icon})`);
  }

  console.log("\n📈 Done! Country quiz types seeded.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
