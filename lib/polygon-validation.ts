/**
 * Polygon validation for country quizzes
 *
 * Checks if a click point is inside a country's polygon using Turf.js
 */

import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import type { Feature, Polygon, MultiPolygon, FeatureCollection } from "geojson";
import * as fs from "fs";
import * as path from "path";

// Cache the world GeoJSON data
let worldGeoJsonCache: FeatureCollection | null = null;
let countryPolygonCache: Map<string, Feature<Polygon | MultiPolygon>> = new Map();

/**
 * Load world.geojson and cache country polygons by ISO-2 code
 */
function loadWorldGeoJson(): void {
  if (worldGeoJsonCache) return;

  const worldGeoJsonPath = path.join(process.cwd(), "public", "world.geojson");
  worldGeoJsonCache = JSON.parse(fs.readFileSync(worldGeoJsonPath, "utf-8")) as FeatureCollection;

  // Build cache by ISO-2 code (lowercase)
  for (const feature of worldGeoJsonCache.features) {
    const isoCode = (feature.properties?.iso_a2 as string)?.toLowerCase();
    if (isoCode && isoCode !== "-99" && isoCode !== "-1") {
      countryPolygonCache.set(isoCode, feature as Feature<Polygon | MultiPolygon>);
    }
  }

  console.log(`[polygon-validation] Loaded ${countryPolygonCache.size} country polygons`);
}

/**
 * Get a country's polygon by ISO-2 code
 */
export function getCountryPolygon(countryCode: string): Feature<Polygon | MultiPolygon> | undefined {
  loadWorldGeoJson();
  return countryPolygonCache.get(countryCode.toLowerCase());
}

/**
 * Check if a point is inside a country's polygon
 *
 * @param lat - Latitude of the clicked point
 * @param lng - Longitude of the clicked point
 * @param countryCode - ISO-2 country code (e.g., "ch", "de", "fr")
 * @returns true if point is inside the country, false otherwise
 */
export function isPointInCountry(lat: number, lng: number, countryCode: string): boolean {
  const countryFeature = getCountryPolygon(countryCode);

  if (!countryFeature) {
    console.warn(`[polygon-validation] No polygon found for country: ${countryCode}`);
    return false;
  }

  // IMPORTANT: Turf.js uses [longitude, latitude] order (GeoJSON spec)
  const clickPoint = point([lng, lat]);

  try {
    return booleanPointInPolygon(clickPoint, countryFeature);
  } catch (error) {
    console.error(`[polygon-validation] Error checking point in polygon:`, error);
    return false;
  }
}

/**
 * Check if a game type is a country quiz (where polygon validation should be used)
 */
export function isCountryQuizGameType(gameType: string): boolean {
  if (!gameType.startsWith("world:")) return false;

  const quizType = gameType.split(":")[1];
  return quizType === "country-flags" || quizType === "place-names";
}
