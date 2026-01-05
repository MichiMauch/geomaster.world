import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { panoramaLocations } from "../lib/db/schema";
import { nanoid } from "nanoid";

// Load environment variables
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variables");
  process.exit(1);
}

const client = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

interface PanoramaLocationData {
  mapillaryImageKey: string;
  name: string;
  nameDe?: string;
  nameEn?: string;
  nameSl?: string;
  latitude: number;
  longitude: number;
  heading?: number;
  pitch?: number;
  countryCode?: string;
  difficulty?: "easy" | "medium" | "hard";
}

// 20 Starter Locations for Street View World
// These are sample Mapillary image keys from various recognizable locations around the world
// Note: Mapillary image keys should be verified and updated with actual accessible keys
const starterLocations: PanoramaLocationData[] = [
  // Europe
  {
    mapillaryImageKey: "311799370754673", // Paris - Eiffel Tower area
    name: "Eiffelturm Umgebung",
    nameEn: "Eiffel Tower Area",
    nameDe: "Eiffelturm Umgebung",
    latitude: 48.8584,
    longitude: 2.2945,
    heading: 180,
    pitch: 0,
    countryCode: "FR",
    difficulty: "easy",
  },
  {
    mapillaryImageKey: "1058638768021850", // Rome - Colosseum area
    name: "Kolosseum Umgebung",
    nameEn: "Colosseum Area",
    nameDe: "Kolosseum Umgebung",
    latitude: 41.8902,
    longitude: 12.4922,
    heading: 90,
    pitch: 0,
    countryCode: "IT",
    difficulty: "easy",
  },
  {
    mapillaryImageKey: "234567890123456", // London - Big Ben area (sample key)
    name: "Big Ben Umgebung",
    nameEn: "Big Ben Area",
    nameDe: "Big Ben Umgebung",
    latitude: 51.5007,
    longitude: -0.1246,
    heading: 270,
    pitch: 0,
    countryCode: "GB",
    difficulty: "easy",
  },
  {
    mapillaryImageKey: "345678901234567", // Berlin - Brandenburg Gate (sample key)
    name: "Brandenburger Tor",
    nameEn: "Brandenburg Gate",
    nameDe: "Brandenburger Tor",
    latitude: 52.5163,
    longitude: 13.3777,
    heading: 0,
    pitch: 0,
    countryCode: "DE",
    difficulty: "easy",
  },
  {
    mapillaryImageKey: "456789012345678", // Amsterdam - Canal (sample key)
    name: "Amsterdamer Grachten",
    nameEn: "Amsterdam Canals",
    nameDe: "Amsterdamer Grachten",
    latitude: 52.3676,
    longitude: 4.9041,
    heading: 45,
    pitch: 0,
    countryCode: "NL",
    difficulty: "medium",
  },
  // North America
  {
    mapillaryImageKey: "567890123456789", // New York - Times Square (sample key)
    name: "Times Square",
    nameEn: "Times Square",
    nameDe: "Times Square",
    latitude: 40.7580,
    longitude: -73.9855,
    heading: 180,
    pitch: 0,
    countryCode: "US",
    difficulty: "easy",
  },
  {
    mapillaryImageKey: "678901234567890", // San Francisco - Golden Gate (sample key)
    name: "Golden Gate Bridge",
    nameEn: "Golden Gate Bridge",
    nameDe: "Golden Gate Bridge",
    latitude: 37.8199,
    longitude: -122.4783,
    heading: 270,
    pitch: 0,
    countryCode: "US",
    difficulty: "easy",
  },
  {
    mapillaryImageKey: "789012345678901", // Las Vegas Strip (sample key)
    name: "Las Vegas Strip",
    nameEn: "Las Vegas Strip",
    nameDe: "Las Vegas Strip",
    latitude: 36.1147,
    longitude: -115.1728,
    heading: 0,
    pitch: 0,
    countryCode: "US",
    difficulty: "medium",
  },
  {
    mapillaryImageKey: "890123456789012", // Toronto - CN Tower area (sample key)
    name: "CN Tower Umgebung",
    nameEn: "CN Tower Area",
    nameDe: "CN Tower Umgebung",
    latitude: 43.6426,
    longitude: -79.3871,
    heading: 90,
    pitch: 0,
    countryCode: "CA",
    difficulty: "medium",
  },
  // Asia
  {
    mapillaryImageKey: "901234567890123", // Tokyo - Shibuya Crossing (sample key)
    name: "Shibuya Kreuzung",
    nameEn: "Shibuya Crossing",
    nameDe: "Shibuya Kreuzung",
    latitude: 35.6595,
    longitude: 139.7004,
    heading: 45,
    pitch: 0,
    countryCode: "JP",
    difficulty: "medium",
  },
  {
    mapillaryImageKey: "012345678901234", // Singapore - Marina Bay (sample key)
    name: "Marina Bay",
    nameEn: "Marina Bay",
    nameDe: "Marina Bay",
    latitude: 1.2834,
    longitude: 103.8607,
    heading: 180,
    pitch: 0,
    countryCode: "SG",
    difficulty: "easy",
  },
  {
    mapillaryImageKey: "123456789012345", // Hong Kong - Victoria Harbor (sample key)
    name: "Victoria Harbour",
    nameEn: "Victoria Harbour",
    nameDe: "Victoria Hafen",
    latitude: 22.2855,
    longitude: 114.1577,
    heading: 270,
    pitch: 0,
    countryCode: "HK",
    difficulty: "medium",
  },
  {
    mapillaryImageKey: "234567890123457", // Bangkok - Grand Palace area (sample key)
    name: "Grosser Palast Bangkok",
    nameEn: "Grand Palace Bangkok",
    nameDe: "Grosser Palast Bangkok",
    latitude: 13.7500,
    longitude: 100.4914,
    heading: 0,
    pitch: 0,
    countryCode: "TH",
    difficulty: "hard",
  },
  // South America
  {
    mapillaryImageKey: "345678901234568", // Rio - Copacabana (sample key)
    name: "Copacabana Strand",
    nameEn: "Copacabana Beach",
    nameDe: "Copacabana Strand",
    latitude: -22.9711,
    longitude: -43.1822,
    heading: 90,
    pitch: 0,
    countryCode: "BR",
    difficulty: "easy",
  },
  {
    mapillaryImageKey: "456789012345679", // Buenos Aires - La Boca (sample key)
    name: "La Boca Buenos Aires",
    nameEn: "La Boca Buenos Aires",
    nameDe: "La Boca Buenos Aires",
    latitude: -34.6345,
    longitude: -58.3630,
    heading: 180,
    pitch: 0,
    countryCode: "AR",
    difficulty: "hard",
  },
  // Australia & Oceania
  {
    mapillaryImageKey: "567890123456790", // Sydney - Opera House (sample key)
    name: "Sydney Opera House",
    nameEn: "Sydney Opera House",
    nameDe: "Sydney Opernhaus",
    latitude: -33.8568,
    longitude: 151.2153,
    heading: 0,
    pitch: 0,
    countryCode: "AU",
    difficulty: "easy",
  },
  {
    mapillaryImageKey: "678901234567891", // Melbourne - Federation Square (sample key)
    name: "Federation Square Melbourne",
    nameEn: "Federation Square Melbourne",
    nameDe: "Federation Square Melbourne",
    latitude: -37.8180,
    longitude: 144.9691,
    heading: 270,
    pitch: 0,
    countryCode: "AU",
    difficulty: "medium",
  },
  // Middle East & Africa
  {
    mapillaryImageKey: "789012345678902", // Dubai - Burj Khalifa (sample key)
    name: "Burj Khalifa Umgebung",
    nameEn: "Burj Khalifa Area",
    nameDe: "Burj Khalifa Umgebung",
    latitude: 25.1972,
    longitude: 55.2744,
    heading: 45,
    pitch: 0,
    countryCode: "AE",
    difficulty: "easy",
  },
  {
    mapillaryImageKey: "890123456789013", // Cape Town - Table Mountain view (sample key)
    name: "Tafelberg Blick",
    nameEn: "Table Mountain View",
    nameDe: "Tafelberg Blick",
    latitude: -33.9625,
    longitude: 18.4039,
    heading: 180,
    pitch: 0,
    countryCode: "ZA",
    difficulty: "medium",
  },
  // Switzerland
  {
    mapillaryImageKey: "901234567890124", // Zurich - Bahnhofstrasse (sample key)
    name: "Bahnhofstrasse Zürich",
    nameEn: "Bahnhofstrasse Zurich",
    nameDe: "Bahnhofstrasse Zürich",
    nameSl: "Bahnhofstrasse Zürich",
    latitude: 47.3769,
    longitude: 8.5392,
    heading: 0,
    pitch: 0,
    countryCode: "CH",
    difficulty: "medium",
  },
];

async function seed() {
  console.log("Starting seed for panorama locations...");

  const now = new Date();

  console.log(`Total panorama locations to insert: ${starterLocations.length}`);

  // Insert all locations
  const values = starterLocations.map((loc) => ({
    id: nanoid(),
    mapillaryImageKey: loc.mapillaryImageKey,
    name: loc.name,
    nameDe: loc.nameDe || null,
    nameEn: loc.nameEn || null,
    nameSl: loc.nameSl || null,
    latitude: loc.latitude,
    longitude: loc.longitude,
    heading: loc.heading || null,
    pitch: loc.pitch || null,
    countryCode: loc.countryCode || null,
    difficulty: loc.difficulty || "medium",
    createdAt: now,
  }));

  await db.insert(panoramaLocations).values(values);

  console.log("\nSeed completed successfully!");
  console.log(`Inserted ${values.length} panorama locations.`);
  console.log("\nNOTE: The Mapillary image keys in this seed are sample values.");
  console.log("You should verify and update them with actual accessible Mapillary image keys.");
  console.log("Find image keys at: https://www.mapillary.com/app/");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
