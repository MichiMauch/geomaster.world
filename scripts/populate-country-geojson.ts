/**
 * Script to populate countries.geoJsonData with polygon data from world.geojson
 *
 * Run with: npx tsx scripts/populate-country-geojson.ts
 */

import { db } from "../lib/db";
import { countries } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

interface GeoJSONFeature {
  type: "Feature";
  properties: {
    iso_a2: string;
    name: string;
    name_de?: string;
    name_en?: string;
    [key: string]: unknown;
  };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
}

interface GeoJSONCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

async function main() {
  console.log("🌍 Loading world.geojson...");

  const worldGeoJsonPath = path.join(process.cwd(), "public", "world.geojson");
  const worldGeoJson: GeoJSONCollection = JSON.parse(
    fs.readFileSync(worldGeoJsonPath, "utf-8")
  );

  console.log(`📊 Found ${worldGeoJson.features.length} countries in world.geojson`);

  // Create a map of ISO codes to GeoJSON features
  const countryMap = new Map<string, GeoJSONFeature>();
  for (const feature of worldGeoJson.features) {
    const isoCode = feature.properties.iso_a2?.toLowerCase();
    if (isoCode && isoCode !== "-99" && isoCode !== "-1") {
      countryMap.set(isoCode, feature);
    }
  }

  console.log(`🗺️  Mapped ${countryMap.size} countries by ISO code`);

  // Get all countries from database
  const dbCountries = await db.select().from(countries);
  console.log(`💾 Found ${dbCountries.length} countries in database`);

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const country of dbCountries) {
    // Skip if already has geoJsonData
    if (country.geoJsonData) {
      console.log(`⏭️  ${country.id}: Already has GeoJSON data, skipping`);
      skipped++;
      continue;
    }

    const feature = countryMap.get(country.id);
    if (!feature) {
      console.log(`❌ ${country.id}: Not found in world.geojson`);
      notFound++;
      continue;
    }

    // Store only the geometry part (we don't need properties)
    const geoJsonData = JSON.stringify(feature.geometry);

    await db
      .update(countries)
      .set({ geoJsonData })
      .where(eq(countries.id, country.id));

    console.log(`✅ ${country.id}: Updated with ${feature.geometry.type} geometry`);
    updated++;
  }

  console.log("\n📈 Summary:");
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped (already has data): ${skipped}`);
  console.log(`   Not found in world.geojson: ${notFound}`);

  // List available countries that could be added
  if (notFound > 0) {
    console.log("\n💡 Countries in DB without GeoJSON match:");
    for (const country of dbCountries) {
      if (!country.geoJsonData && !countryMap.has(country.id)) {
        console.log(`   - ${country.id} (${country.name})`);
      }
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
