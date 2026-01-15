/**
 * Geo-Check Utility
 * Check if a point is inside a country's boundaries
 */

import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import type { Feature, Polygon, MultiPolygon, FeatureCollection } from "geojson";

// Cache for loaded GeoJSON data
let countriesGeoJSON: FeatureCollection | null = null;
let countryIndex: Map<string, Feature<Polygon | MultiPolygon>> | null = null;

/**
 * Load and cache the world countries GeoJSON
 * Server-side only - uses fs to read the file
 */
async function loadCountriesGeoJSON(): Promise<void> {
  if (countriesGeoJSON && countryIndex) return;

  try {
    // Dynamic import for server-side only
    const fs = await import("fs/promises");
    const path = await import("path");

    const filePath = path.join(process.cwd(), "public", "data", "world-countries.geojson");
    const data = await fs.readFile(filePath, "utf-8");
    countriesGeoJSON = JSON.parse(data) as FeatureCollection;

    // Build index by ISO_A2 code (lowercase)
    countryIndex = new Map();
    for (const feature of countriesGeoJSON.features) {
      const isoA2 = feature.properties?.ISO_A2;
      if (isoA2 && typeof isoA2 === "string" && isoA2 !== "-99") {
        countryIndex.set(isoA2.toLowerCase(), feature as Feature<Polygon | MultiPolygon>);
      }
    }

    console.log(`[geo-check] Loaded ${countryIndex.size} countries`);
  } catch (error) {
    console.error("[geo-check] Failed to load countries GeoJSON:", error);
    throw error;
  }
}

/**
 * Check if a point (lat, lng) is inside a country
 *
 * @param lat - Latitude of the point
 * @param lng - Longitude of the point
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., "de", "ch", "us")
 * @returns true if point is inside the country, false otherwise
 */
export async function isPointInCountry(
  lat: number,
  lng: number,
  countryCode: string
): Promise<boolean> {
  await loadCountriesGeoJSON();

  if (!countryIndex) {
    console.warn("[geo-check] Country index not loaded");
    return false;
  }

  const countryFeature = countryIndex.get(countryCode.toLowerCase());
  if (!countryFeature) {
    console.warn(`[geo-check] Country not found: ${countryCode}`);
    return false;
  }

  try {
    const pt = point([lng, lat]); // GeoJSON uses [lng, lat] order
    return booleanPointInPolygon(pt, countryFeature);
  } catch (error) {
    console.error(`[geo-check] Error checking point in polygon:`, error);
    return false;
  }
}

/**
 * Get all available country codes
 */
export async function getAvailableCountryCodes(): Promise<string[]> {
  await loadCountriesGeoJSON();
  return countryIndex ? Array.from(countryIndex.keys()) : [];
}

/**
 * Check if a country code exists in our data
 */
export async function hasCountryData(countryCode: string): Promise<boolean> {
  await loadCountriesGeoJSON();
  return countryIndex?.has(countryCode.toLowerCase()) ?? false;
}
