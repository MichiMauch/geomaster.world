import { db } from "../lib/db";
import { countries } from "../lib/db/schema";
import * as fs from "fs";
import * as path from "path";

async function seedCountries() {
  console.log("Seeding countries...");

  // Read GeoJSON files
  const switzerlandGeoJson = fs.readFileSync(
    path.join(process.cwd(), "public", "switzerland.geojson"),
    "utf-8"
  );
  const sloveniaGeoJson = fs.readFileSync(
    path.join(process.cwd(), "public", "slovenia.geojson"),
    "utf-8"
  );

  const countryData = [
    {
      id: "switzerland",
      name: "Schweiz",
      nameEn: "Switzerland",
      nameSl: "Švica",
      icon: "🇨🇭",
      geoJsonData: switzerlandGeoJson,
      centerLat: 46.8,
      centerLng: 8.2,
      defaultZoom: 8,
      minZoom: 7,
      boundsNorth: 47.8,
      boundsSouth: 45.8,
      boundsEast: 10.5,
      boundsWest: 5.9,
      timeoutPenalty: 400,
      scoreScaleFactor: 100,
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: "slovenia",
      name: "Slowenien",
      nameEn: "Slovenia",
      nameSl: "Slovenija",
      icon: "🇸🇮",
      geoJsonData: sloveniaGeoJson,
      centerLat: 46.1,
      centerLng: 15.0,
      defaultZoom: 8,
      minZoom: 7,
      boundsNorth: 46.9,
      boundsSouth: 45.4,
      boundsEast: 16.6,
      boundsWest: 13.4,
      timeoutPenalty: 250,
      scoreScaleFactor: 60,
      isActive: true,
      createdAt: new Date(),
    },
  ];

  for (const country of countryData) {
    console.log(`Inserting ${country.id}...`);
    await db
      .insert(countries)
      .values(country)
      .onConflictDoUpdate({
        target: countries.id,
        set: {
          name: country.name,
          nameEn: country.nameEn,
          nameSl: country.nameSl,
          icon: country.icon,
          geoJsonData: country.geoJsonData,
          centerLat: country.centerLat,
          centerLng: country.centerLng,
          defaultZoom: country.defaultZoom,
          minZoom: country.minZoom,
          boundsNorth: country.boundsNorth,
          boundsSouth: country.boundsSouth,
          boundsEast: country.boundsEast,
          boundsWest: country.boundsWest,
          timeoutPenalty: country.timeoutPenalty,
          scoreScaleFactor: country.scoreScaleFactor,
          isActive: country.isActive,
        },
      });
  }

  console.log("Done seeding countries!");
}

seedCountries()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error seeding countries:", err);
    process.exit(1);
  });
