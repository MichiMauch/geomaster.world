import { db } from "../lib/db";
import { horizonItems } from "../lib/db/schema";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

// -------------------------------------------------------------------
// Category mapping: resolve mixed-unit categories into sub-categories
// Key = "originalCategory|unit" → value = resolved category
// Categories with a single unit keep their original name.
// -------------------------------------------------------------------
const CATEGORY_MAP: Record<string, string> = {
  // Extremes — mixed units → split
  "extremes|°C": "extremes_temperature",
  "extremes|mm": "extremes_rainfall",

  // Lakes — mixed units → split
  "lakes|km²": "lakes_area",
  "lakes|Meter": "lakes_depth",

  // Landmark — mostly Meter, but also Kilometer
  "landmark|Meter": "landmarks_height",
  "landmark|Kilometer": "landmarks_length",

  // Nature — mixed Meter/Kilometer
  "nature|Meter": "nature_elevation",
  "nature|Kilometer": "nature_rivers",

  // Space — mixed units → split
  "space|km": "space_distance",
  "space|Kilometer": "space_distance",
  "space|Sekunden": "space_time",
  "space|Stunden": "space_time",

  // Single-unit categories stay as-is
  "islands|km²": "islands",
  "distance|km": "distances",
  "city|Einwohner": "cities_population",
};

interface RawItem {
  id: string;
  name: string;
  value: number;
  unit: string;
  category: string;
  difficulty: number;
  trap_note: string;
}

interface CountryItem {
  id: string;
  name: string;
  population: number;
  area_km2: number;
  highest_point: number;
  difficulty: number;
  trap_note: string;
}

function resolveCategory(originalCategory: string, unit: string): string {
  const key = `${originalCategory}|${unit}`;
  return CATEGORY_MAP[key] || originalCategory;
}

async function seed() {
  console.log("🎮 Seeding horizon items...\n");

  // Ensure table exists
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS stats_battle_items (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      value REAL NOT NULL,
      unit TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty INTEGER NOT NULL DEFAULT 2,
      trap_note TEXT,
      createdAt INTEGER NOT NULL
    )
  `);
  console.log("  📋 Table ensured\n");

  // Clear all existing items so old/removed categories don't linger
  await db.delete(horizonItems);
  console.log("🗑️  Cleared existing horizon items\n");

  const dataDir = path.join(process.cwd(), "scripts", "data", "horizon");

  // 1. Read the 3 flat JSON files
  const flatFiles = ["cold.json", "pop.json", "highlowdiff.json"];
  const flatItems: RawItem[] = [];

  for (const file of flatFiles) {
    const filePath = path.join(dataDir, file);
    const data: RawItem[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    flatItems.push(...data);
    console.log(`  📄 ${file}: ${data.length} items`);
  }

  // 2. Read countryhighlow.json and transform to 3 items per country
  const countryPath = path.join(dataDir, "countryhighlow.json");
  const countryData: CountryItem[] = JSON.parse(
    fs.readFileSync(countryPath, "utf-8")
  );
  console.log(
    `  📄 countryhighlow.json: ${countryData.length} countries → ${countryData.length * 3} items`
  );

  // 3. Build all items
  const allItems: Array<{
    id: string;
    name: string;
    value: number;
    unit: string;
    category: string;
    difficulty: number;
    trapNote: string | null;
    createdAt: Date;
  }> = [];

  // 3a. Flat items with category resolution
  for (const item of flatItems) {
    allItems.push({
      id: item.id,
      name: item.name,
      value: item.value,
      unit: item.unit,
      category: resolveCategory(item.category, item.unit),
      difficulty: item.difficulty,
      trapNote: item.trap_note || null,
      createdAt: new Date(),
    });
  }

  // 3b. Country items → 3 entries each
  for (const country of countryData) {
    allItems.push({
      id: `${country.id}_pop`,
      name: `${country.name} (Bevölkerung)`,
      value: country.population,
      unit: "Einwohner",
      category: "countries_population",
      difficulty: country.difficulty,
      trapNote: country.trap_note || null,
      createdAt: new Date(),
    });

    allItems.push({
      id: `${country.id}_area`,
      name: `${country.name} (Fläche)`,
      value: country.area_km2,
      unit: "km²",
      category: "countries_area",
      difficulty: country.difficulty,
      trapNote: country.trap_note || null,
      createdAt: new Date(),
    });

    allItems.push({
      id: `${country.id}_peak`,
      name: `${country.name} (Höchster Punkt)`,
      value: country.highest_point,
      unit: "Meter",
      category: "countries_elevation",
      difficulty: country.difficulty,
      trapNote: country.trap_note || null,
      createdAt: new Date(),
    });
  }

  // 4. Check for duplicate IDs
  const idSet = new Set<string>();
  const duplicates: string[] = [];
  for (const item of allItems) {
    if (idSet.has(item.id)) {
      duplicates.push(item.id);
    }
    idSet.add(item.id);
  }
  if (duplicates.length > 0) {
    console.warn(`\n⚠️  Duplicate IDs found: ${duplicates.join(", ")}`);
    console.warn("   Duplicates will be overwritten (upsert).\n");
  }

  // 5. Insert in batches
  const BATCH_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < allItems.length; i += BATCH_SIZE) {
    const batch = allItems.slice(i, i + BATCH_SIZE);

    for (const item of batch) {
      await db
        .insert(horizonItems)
        .values(item)
        .onConflictDoUpdate({
          target: horizonItems.id,
          set: {
            name: item.name,
            value: item.value,
            unit: item.unit,
            category: item.category,
            difficulty: item.difficulty,
            trapNote: item.trapNote,
          },
        });
    }

    inserted += batch.length;
    console.log(`  ✅ ${inserted}/${allItems.length} items inserted`);
  }

  // 6. Summary by category
  console.log("\n📊 Categories summary:");
  const categoryCounts = new Map<string, number>();
  for (const item of allItems) {
    categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + 1);
  }
  for (const [cat, count] of [...categoryCounts.entries()].sort()) {
    console.log(`  ${cat}: ${count} items`);
  }

  console.log(`\n🎉 Done! ${allItems.length} total items seeded.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error seeding horizon:", err);
    process.exit(1);
  });
