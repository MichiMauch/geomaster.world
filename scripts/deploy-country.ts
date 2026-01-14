/**
 * Deploy Country Script
 *
 * Takes assets from ~/Downloads/geomaster-<country>/ and:
 * 1. Copies images to public/images/countries/
 * 2. Creates country entry in database
 * 3. Imports locations to database
 * 4. Triggers translation for location names
 *
 * Usage: npx tsx scripts/deploy-country.ts <country-id>
 * Example: npx tsx scripts/deploy-country.ts sweden
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import sharp from "sharp";
import { db } from "../lib/db";
import { countries, locations } from "../lib/db/schema";
import { parseGeoJSONForCountry } from "../lib/utils/geojson-utils";
import { TranslationService } from "../lib/services/translation-service";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

const MAX_WIDTH = 1000;

// Country Mapping (same as in add-country skill)
const COUNTRY_MAPPING: Record<string, { iso3: string; iso2: string; nameDe: string; nameEn: string; flag: string }> = {
  "switzerland": { iso3: "CHE", iso2: "ch", nameDe: "Schweiz", nameEn: "Switzerland", flag: "\u{1F1E8}\u{1F1ED}" },
  "germany": { iso3: "DEU", iso2: "de", nameDe: "Deutschland", nameEn: "Germany", flag: "\u{1F1E9}\u{1F1EA}" },
  "austria": { iso3: "AUT", iso2: "at", nameDe: "\u00D6sterreich", nameEn: "Austria", flag: "\u{1F1E6}\u{1F1F9}" },
  "france": { iso3: "FRA", iso2: "fr", nameDe: "Frankreich", nameEn: "France", flag: "\u{1F1EB}\u{1F1F7}" },
  "italy": { iso3: "ITA", iso2: "it", nameDe: "Italien", nameEn: "Italy", flag: "\u{1F1EE}\u{1F1F9}" },
  "spain": { iso3: "ESP", iso2: "es", nameDe: "Spanien", nameEn: "Spain", flag: "\u{1F1EA}\u{1F1F8}" },
  "portugal": { iso3: "PRT", iso2: "pt", nameDe: "Portugal", nameEn: "Portugal", flag: "\u{1F1F5}\u{1F1F9}" },
  "united-kingdom": { iso3: "GBR", iso2: "gb", nameDe: "Vereinigtes K\u00F6nigreich", nameEn: "United Kingdom", flag: "\u{1F1EC}\u{1F1E7}" },
  "ireland": { iso3: "IRL", iso2: "ie", nameDe: "Irland", nameEn: "Ireland", flag: "\u{1F1EE}\u{1F1EA}" },
  "netherlands": { iso3: "NLD", iso2: "nl", nameDe: "Niederlande", nameEn: "Netherlands", flag: "\u{1F1F3}\u{1F1F1}" },
  "belgium": { iso3: "BEL", iso2: "be", nameDe: "Belgien", nameEn: "Belgium", flag: "\u{1F1E7}\u{1F1EA}" },
  "luxembourg": { iso3: "LUX", iso2: "lu", nameDe: "Luxemburg", nameEn: "Luxembourg", flag: "\u{1F1F1}\u{1F1FA}" },
  "poland": { iso3: "POL", iso2: "pl", nameDe: "Polen", nameEn: "Poland", flag: "\u{1F1F5}\u{1F1F1}" },
  "czech-republic": { iso3: "CZE", iso2: "cz", nameDe: "Tschechien", nameEn: "Czech Republic", flag: "\u{1F1E8}\u{1F1FF}" },
  "slovakia": { iso3: "SVK", iso2: "sk", nameDe: "Slowakei", nameEn: "Slovakia", flag: "\u{1F1F8}\u{1F1F0}" },
  "hungary": { iso3: "HUN", iso2: "hu", nameDe: "Ungarn", nameEn: "Hungary", flag: "\u{1F1ED}\u{1F1FA}" },
  "slovenia": { iso3: "SVN", iso2: "si", nameDe: "Slowenien", nameEn: "Slovenia", flag: "\u{1F1F8}\u{1F1EE}" },
  "croatia": { iso3: "HRV", iso2: "hr", nameDe: "Kroatien", nameEn: "Croatia", flag: "\u{1F1ED}\u{1F1F7}" },
  "serbia": { iso3: "SRB", iso2: "rs", nameDe: "Serbien", nameEn: "Serbia", flag: "\u{1F1F7}\u{1F1F8}" },
  "bosnia": { iso3: "BIH", iso2: "ba", nameDe: "Bosnien", nameEn: "Bosnia", flag: "\u{1F1E7}\u{1F1E6}" },
  "montenegro": { iso3: "MNE", iso2: "me", nameDe: "Montenegro", nameEn: "Montenegro", flag: "\u{1F1F2}\u{1F1EA}" },
  "albania": { iso3: "ALB", iso2: "al", nameDe: "Albanien", nameEn: "Albania", flag: "\u{1F1E6}\u{1F1F1}" },
  "north-macedonia": { iso3: "MKD", iso2: "mk", nameDe: "Nordmazedonien", nameEn: "North Macedonia", flag: "\u{1F1F2}\u{1F1F0}" },
  "greece": { iso3: "GRC", iso2: "gr", nameDe: "Griechenland", nameEn: "Greece", flag: "\u{1F1EC}\u{1F1F7}" },
  "bulgaria": { iso3: "BGR", iso2: "bg", nameDe: "Bulgarien", nameEn: "Bulgaria", flag: "\u{1F1E7}\u{1F1EC}" },
  "romania": { iso3: "ROU", iso2: "ro", nameDe: "Rum\u00E4nien", nameEn: "Romania", flag: "\u{1F1F7}\u{1F1F4}" },
  "moldova": { iso3: "MDA", iso2: "md", nameDe: "Moldawien", nameEn: "Moldova", flag: "\u{1F1F2}\u{1F1E9}" },
  "ukraine": { iso3: "UKR", iso2: "ua", nameDe: "Ukraine", nameEn: "Ukraine", flag: "\u{1F1FA}\u{1F1E6}" },
  "belarus": { iso3: "BLR", iso2: "by", nameDe: "Belarus", nameEn: "Belarus", flag: "\u{1F1E7}\u{1F1FE}" },
  "lithuania": { iso3: "LTU", iso2: "lt", nameDe: "Litauen", nameEn: "Lithuania", flag: "\u{1F1F1}\u{1F1F9}" },
  "latvia": { iso3: "LVA", iso2: "lv", nameDe: "Lettland", nameEn: "Latvia", flag: "\u{1F1F1}\u{1F1FB}" },
  "estonia": { iso3: "EST", iso2: "ee", nameDe: "Estland", nameEn: "Estonia", flag: "\u{1F1EA}\u{1F1EA}" },
  "finland": { iso3: "FIN", iso2: "fi", nameDe: "Finnland", nameEn: "Finland", flag: "\u{1F1EB}\u{1F1EE}" },
  "sweden": { iso3: "SWE", iso2: "se", nameDe: "Schweden", nameEn: "Sweden", flag: "\u{1F1F8}\u{1F1EA}" },
  "norway": { iso3: "NOR", iso2: "no", nameDe: "Norwegen", nameEn: "Norway", flag: "\u{1F1F3}\u{1F1F4}" },
  "denmark": { iso3: "DNK", iso2: "dk", nameDe: "D\u00E4nemark", nameEn: "Denmark", flag: "\u{1F1E9}\u{1F1F0}" },
  "iceland": { iso3: "ISL", iso2: "is", nameDe: "Island", nameEn: "Iceland", flag: "\u{1F1EE}\u{1F1F8}" },
  "russia": { iso3: "RUS", iso2: "ru", nameDe: "Russland", nameEn: "Russia", flag: "\u{1F1F7}\u{1F1FA}" },
  "turkey": { iso3: "TUR", iso2: "tr", nameDe: "T\u00FCrkei", nameEn: "Turkey", flag: "\u{1F1F9}\u{1F1F7}" },
  "cyprus": { iso3: "CYP", iso2: "cy", nameDe: "Zypern", nameEn: "Cyprus", flag: "\u{1F1E8}\u{1F1FE}" },
  "malta": { iso3: "MLT", iso2: "mt", nameDe: "Malta", nameEn: "Malta", flag: "\u{1F1F2}\u{1F1F9}" },
  "japan": { iso3: "JPN", iso2: "jp", nameDe: "Japan", nameEn: "Japan", flag: "\u{1F1EF}\u{1F1F5}" },
  "china": { iso3: "CHN", iso2: "cn", nameDe: "China", nameEn: "China", flag: "\u{1F1E8}\u{1F1F3}" },
  "south-korea": { iso3: "KOR", iso2: "kr", nameDe: "S\u00FCdkorea", nameEn: "South Korea", flag: "\u{1F1F0}\u{1F1F7}" },
  "india": { iso3: "IND", iso2: "in", nameDe: "Indien", nameEn: "India", flag: "\u{1F1EE}\u{1F1F3}" },
  "thailand": { iso3: "THA", iso2: "th", nameDe: "Thailand", nameEn: "Thailand", flag: "\u{1F1F9}\u{1F1ED}" },
  "vietnam": { iso3: "VNM", iso2: "vn", nameDe: "Vietnam", nameEn: "Vietnam", flag: "\u{1F1FB}\u{1F1F3}" },
  "indonesia": { iso3: "IDN", iso2: "id", nameDe: "Indonesien", nameEn: "Indonesia", flag: "\u{1F1EE}\u{1F1E9}" },
  "philippines": { iso3: "PHL", iso2: "ph", nameDe: "Philippinen", nameEn: "Philippines", flag: "\u{1F1F5}\u{1F1ED}" },
  "australia": { iso3: "AUS", iso2: "au", nameDe: "Australien", nameEn: "Australia", flag: "\u{1F1E6}\u{1F1FA}" },
  "new-zealand": { iso3: "NZL", iso2: "nz", nameDe: "Neuseeland", nameEn: "New Zealand", flag: "\u{1F1F3}\u{1F1FF}" },
  "canada": { iso3: "CAN", iso2: "ca", nameDe: "Kanada", nameEn: "Canada", flag: "\u{1F1E8}\u{1F1E6}" },
  "united-states": { iso3: "USA", iso2: "us", nameDe: "Vereinigte Staaten", nameEn: "United States", flag: "\u{1F1FA}\u{1F1F8}" },
  "mexico": { iso3: "MEX", iso2: "mx", nameDe: "Mexiko", nameEn: "Mexico", flag: "\u{1F1F2}\u{1F1FD}" },
  "brazil": { iso3: "BRA", iso2: "br", nameDe: "Brasilien", nameEn: "Brazil", flag: "\u{1F1E7}\u{1F1F7}" },
  "argentina": { iso3: "ARG", iso2: "ar", nameDe: "Argentinien", nameEn: "Argentina", flag: "\u{1F1E6}\u{1F1F7}" },
  "chile": { iso3: "CHL", iso2: "cl", nameDe: "Chile", nameEn: "Chile", flag: "\u{1F1E8}\u{1F1F1}" },
  "peru": { iso3: "PER", iso2: "pe", nameDe: "Peru", nameEn: "Peru", flag: "\u{1F1F5}\u{1F1EA}" },
  "colombia": { iso3: "COL", iso2: "co", nameDe: "Kolumbien", nameEn: "Colombia", flag: "\u{1F1E8}\u{1F1F4}" },
  "egypt": { iso3: "EGY", iso2: "eg", nameDe: "\u00C4gypten", nameEn: "Egypt", flag: "\u{1F1EA}\u{1F1EC}" },
  "south-africa": { iso3: "ZAF", iso2: "za", nameDe: "S\u00FCdafrika", nameEn: "South Africa", flag: "\u{1F1FF}\u{1F1E6}" },
  "morocco": { iso3: "MAR", iso2: "ma", nameDe: "Marokko", nameEn: "Morocco", flag: "\u{1F1F2}\u{1F1E6}" },
  "kenya": { iso3: "KEN", iso2: "ke", nameDe: "Kenia", nameEn: "Kenya", flag: "\u{1F1F0}\u{1F1EA}" },
  "israel": { iso3: "ISR", iso2: "il", nameDe: "Israel", nameEn: "Israel", flag: "\u{1F1EE}\u{1F1F1}" },
  "united-arab-emirates": { iso3: "ARE", iso2: "ae", nameDe: "Vereinigte Arabische Emirate", nameEn: "United Arab Emirates", flag: "\u{1F1E6}\u{1F1EA}" },
  "saudi-arabia": { iso3: "SAU", iso2: "sa", nameDe: "Saudi-Arabien", nameEn: "Saudi Arabia", flag: "\u{1F1F8}\u{1F1E6}" },
};

interface LocationData {
  name: string;
  latitude: number;
  longitude: number;
}

async function deployCountry(countryId: string) {
  console.log(`\n\u{1F680} Deploying country: ${countryId}\n`);

  // Get country info from mapping
  const countryInfo = COUNTRY_MAPPING[countryId];
  if (!countryInfo) {
    console.error(`\u274C Unknown country: ${countryId}`);
    console.log("Available countries:", Object.keys(COUNTRY_MAPPING).join(", "));
    process.exit(1);
  }

  // Define paths
  const assetsDir = path.join(os.homedir(), "Downloads", `geomaster-${countryId}`);
  const publicDir = path.join(process.cwd(), "public", "images", "countries");

  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Check required files
  const requiredFiles = {
    geojson: path.join(assetsDir, `${countryId}.geojson`),
    locations: path.join(assetsDir, `${countryId}-locations.json`),
    flag: path.join(assetsDir, `${countryId}-flag.gif`),
    headerMap: path.join(assetsDir, `${countryId}-header-map.jpg`),
    asset: path.join(assetsDir, `${countryId}-asset.jpg`),
    scenery: path.join(assetsDir, `${countryId}-scenery.jpg`),
  };

  console.log("\u{1F4C1} Checking assets...");
  for (const [name, filePath] of Object.entries(requiredFiles)) {
    if (!fs.existsSync(filePath)) {
      console.error(`\u274C Missing file: ${name} (${filePath})`);
      process.exit(1);
    }
    const stats = fs.statSync(filePath);
    console.log(`   \u2713 ${name}: ${(stats.size / 1024).toFixed(1)} KB`);
  }

  // Read and parse GeoJSON
  console.log("\n\u{1F5FA}\uFE0F  Parsing GeoJSON...");
  const geojsonString = fs.readFileSync(requiredFiles.geojson, "utf-8");
  const { bounds, center, scoring, zoom, diagonal } = parseGeoJSONForCountry(geojsonString);

  console.log(`   Bounds: N${bounds.north.toFixed(2)} S${bounds.south.toFixed(2)} E${bounds.east.toFixed(2)} W${bounds.west.toFixed(2)}`);
  console.log(`   Center: ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`);
  console.log(`   Diagonal: ${diagonal.toFixed(0)} km`);
  console.log(`   Scoring: timeout=${scoring.timeoutPenalty}km, scale=${scoring.scoreScaleFactor}km`);
  console.log(`   Zoom: default=${zoom.defaultZoom}, min=${zoom.minZoom}`);

  // Process and copy images with timestamp
  console.log("\n\u{1F5BC}\uFE0F  Processing images...");
  const timestamp = Date.now();

  const imagePaths: Record<string, string> = {};

  // 1. Flag - keep as GIF (for animations)
  const flagFilename = `${countryId}-flag-${timestamp}.gif`;
  fs.copyFileSync(requiredFiles.flag, path.join(publicDir, flagFilename));
  imagePaths.flagImage = `/api/images/countries/${flagFilename}`;
  console.log(`   \u2713 flag: ${flagFilename}`);

  // 2. Landmark (asset) - remove background and convert to WebP
  console.log("   \u23F3 landmark: Processing with remove.bg...");
  let landmarkBuffer = fs.readFileSync(requiredFiles.asset);

  if (process.env.REMOVE_BG_API_KEY) {
    try {
      const removeBgForm = new FormData();
      removeBgForm.append("image_file", new Blob([landmarkBuffer]), "landmark.jpg");
      removeBgForm.append("size", "auto");

      const bgResponse = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: { "X-Api-Key": process.env.REMOVE_BG_API_KEY },
        body: removeBgForm,
      });

      if (bgResponse.ok) {
        landmarkBuffer = Buffer.from(await bgResponse.arrayBuffer());
        console.log("   \u2713 landmark: Background removed");
      } else {
        console.log(`   \u26A0\uFE0F  landmark: remove.bg failed (${bgResponse.status}), using original`);
      }
    } catch (err) {
      console.log("   \u26A0\uFE0F  landmark: remove.bg error, using original");
    }
  } else {
    console.log("   \u26A0\uFE0F  landmark: No REMOVE_BG_API_KEY, skipping background removal");
  }

  // Convert landmark to WebP with transparency support
  const landmarkFilename = `${countryId}-landmark-${timestamp}.webp`;
  const landmarkWebp = await sharp(landmarkBuffer)
    .resize(MAX_WIDTH, null, { withoutEnlargement: true, fit: "inside" })
    .webp({ quality: 90, alphaQuality: 100 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, landmarkFilename), landmarkWebp);
  imagePaths.landmarkImage = `/api/images/countries/${landmarkFilename}`;
  console.log(`   \u2713 landmark: ${landmarkFilename} (${(landmarkWebp.length / 1024).toFixed(0)} KB)`);

  // 3. Background (scenery) - convert to WebP
  const backgroundFilename = `${countryId}-background-${timestamp}.webp`;
  const backgroundWebp = await sharp(fs.readFileSync(requiredFiles.scenery))
    .resize(MAX_WIDTH, null, { withoutEnlargement: true, fit: "inside" })
    .webp({ quality: 85 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, backgroundFilename), backgroundWebp);
  imagePaths.backgroundImage = `/api/images/countries/${backgroundFilename}`;
  console.log(`   \u2713 background: ${backgroundFilename} (${(backgroundWebp.length / 1024).toFixed(0)} KB)`);

  // 4. Card (header-map) - convert to WebP
  const cardFilename = `${countryId}-card-${timestamp}.webp`;
  const cardWebp = await sharp(fs.readFileSync(requiredFiles.headerMap))
    .resize(MAX_WIDTH, null, { withoutEnlargement: true, fit: "inside" })
    .webp({ quality: 85 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, cardFilename), cardWebp);
  imagePaths.cardImage = `/api/images/countries/${cardFilename}`;
  console.log(`   \u2713 card: ${cardFilename} (${(cardWebp.length / 1024).toFixed(0)} KB)`);

  // Create/update country in database
  console.log("\n\u{1F4BE} Creating database entry...");

  const countryData = {
    id: countryId,
    name: countryInfo.nameDe,
    nameEn: countryInfo.nameEn,
    nameSl: countryInfo.nameDe, // Will be translated later if needed
    icon: countryInfo.flag,
    geoJsonData: geojsonString,
    centerLat: center.lat,
    centerLng: center.lng,
    defaultZoom: zoom.defaultZoom,
    minZoom: zoom.minZoom,
    boundsNorth: bounds.north,
    boundsSouth: bounds.south,
    boundsEast: bounds.east,
    boundsWest: bounds.west,
    timeoutPenalty: scoring.timeoutPenalty,
    scoreScaleFactor: scoring.scoreScaleFactor,
    flagImage: imagePaths.flagImage,
    backgroundImage: imagePaths.backgroundImage,
    cardImage: imagePaths.cardImage,
    landmarkImage: imagePaths.landmarkImage,
    isActive: true,
    createdAt: new Date(),
  };

  await db
    .insert(countries)
    .values(countryData)
    .onConflictDoUpdate({
      target: countries.id,
      set: {
        name: countryData.name,
        nameEn: countryData.nameEn,
        nameSl: countryData.nameSl,
        icon: countryData.icon,
        geoJsonData: countryData.geoJsonData,
        centerLat: countryData.centerLat,
        centerLng: countryData.centerLng,
        defaultZoom: countryData.defaultZoom,
        minZoom: countryData.minZoom,
        boundsNorth: countryData.boundsNorth,
        boundsSouth: countryData.boundsSouth,
        boundsEast: countryData.boundsEast,
        boundsWest: countryData.boundsWest,
        timeoutPenalty: countryData.timeoutPenalty,
        scoreScaleFactor: countryData.scoreScaleFactor,
        flagImage: countryData.flagImage,
        backgroundImage: countryData.backgroundImage,
        cardImage: countryData.cardImage,
        landmarkImage: countryData.landmarkImage,
        isActive: countryData.isActive,
      },
    });

  console.log(`   \u2713 Country "${countryInfo.nameDe}" created/updated`);

  // Import locations
  console.log("\n\u{1F4CD} Importing locations...");
  const locationsData: LocationData[] = JSON.parse(
    fs.readFileSync(requiredFiles.locations, "utf-8")
  );

  console.log(`   Found ${locationsData.length} locations`);

  // Delete existing locations for this country first
  await db.delete(locations).where(eq(locations.country, countryInfo.nameEn));
  console.log(`   \u2713 Cleared existing locations for ${countryInfo.nameEn}`);

  // Insert new locations
  const now = new Date();
  let inserted = 0;

  for (const loc of locationsData) {
    await db.insert(locations).values({
      id: nanoid(),
      name: loc.name,
      latitude: loc.latitude,
      longitude: loc.longitude,
      country: countryInfo.nameEn,
      difficulty: "medium",
      createdAt: now,
    });
    inserted++;
  }

  console.log(`   \u2713 Inserted ${inserted} locations`);

  // Translate locations
  console.log("\n\u{1F30D} Translating location names...");
  try {
    const names = locationsData.map(loc => loc.name);
    const translations = await TranslationService.translateBatch(names);

    // Update locations with translations
    let translated = 0;
    for (const translation of translations) {
      await db
        .update(locations)
        .set({
          nameDe: translation.nameDe,
          nameEn: translation.nameEn,
          nameSl: translation.nameSl,
        })
        .where(eq(locations.name, translation.original));
      translated++;
    }

    console.log(`   \u2713 Translated ${translated} location names`);
  } catch (error) {
    console.log(`   \u26A0\uFE0F  Translation skipped (API error or no API key)`);
    if (error instanceof Error) {
      console.log(`      ${error.message}`);
    }
  }

  // Summary
  console.log("\n\u2550".repeat(60));
  console.log(`\u2705 DEPLOYMENT COMPLETE: ${countryInfo.nameDe}`);
  console.log("\u2550".repeat(60));
  console.log(`
\u{1F4CA} Summary:
   \u2022 Country: ${countryInfo.nameDe} (${countryId})
   \u2022 Locations: ${inserted} POIs imported
   \u2022 Images: 4 files deployed
   \u2022 Status: Active

\u{1F3AE} Play at: geomaster.world/guesser/country:${countryId}
`);
}

// Main
const countryId = process.argv[2];

if (!countryId) {
  console.error("Usage: npx tsx scripts/deploy-country.ts <country-id>");
  console.error("Example: npx tsx scripts/deploy-country.ts sweden");
  process.exit(1);
}

deployCountry(countryId)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\u274C Deployment failed:", err);
    process.exit(1);
  });
