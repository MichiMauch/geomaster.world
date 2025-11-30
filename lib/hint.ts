import { getCountryBounds, DEFAULT_COUNTRY } from "./countries";

const EARTH_RADIUS_KM = 6371;

// Approximate km per degree at Swiss latitudes
const KM_PER_DEGREE_LAT = 111;
const KM_PER_DEGREE_LNG = 75; // ~111 * cos(47°)

/**
 * Calculate a point at a given distance and bearing from a start point
 */
function calculateDestination(
  lat: number,
  lng: number,
  distanceKm: number,
  bearingDegrees: number
): { lat: number; lng: number } {
  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;
  const bearing = (bearingDegrees * Math.PI) / 180;
  const angularDistance = distanceKm / EARTH_RADIUS_KM;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
    Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
  );

  const lng2 = lng1 + Math.atan2(
    Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
    Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
  );

  return {
    lat: (lat2 * 180) / Math.PI,
    lng: (lng2 * 180) / Math.PI,
  };
}

/**
 * Check if a circle (center + radius) stays within country bounds
 */
function isCircleWithinBounds(
  centerLat: number,
  centerLng: number,
  radiusKm: number,
  country: string
): boolean {
  const bounds = getCountryBounds(country);

  // Convert radius to approximate degrees
  const radiusLat = radiusKm / KM_PER_DEGREE_LAT;
  const radiusLng = radiusKm / KM_PER_DEGREE_LNG;

  // Check if circle edges are within bounds
  const northEdge = centerLat + radiusLat;
  const southEdge = centerLat - radiusLat;
  const eastEdge = centerLng + radiusLng;
  const westEdge = centerLng - radiusLng;

  return (
    southEdge >= bounds.southWest.lat &&
    northEdge <= bounds.northEast.lat &&
    westEdge >= bounds.southWest.lng &&
    eastEdge <= bounds.northEast.lng
  );
}

/**
 * Calculate the best bearing to keep circle within bounds
 * Returns bearings sorted by how much of the circle stays in bounds
 */
function getBestBearings(
  targetLat: number,
  targetLng: number,
  country: string
): number[] {
  const bounds = getCountryBounds(country);

  // Calculate distances to each border
  const distToNorth = (bounds.northEast.lat - targetLat) * KM_PER_DEGREE_LAT;
  const distToSouth = (targetLat - bounds.southWest.lat) * KM_PER_DEGREE_LAT;
  const distToEast = (bounds.northEast.lng - targetLng) * KM_PER_DEGREE_LNG;
  const distToWest = (targetLng - bounds.southWest.lng) * KM_PER_DEGREE_LNG;

  // Score each cardinal direction by available space
  const directions = [
    { bearing: 0, space: distToNorth },     // North
    { bearing: 45, space: Math.min(distToNorth, distToEast) },
    { bearing: 90, space: distToEast },     // East
    { bearing: 135, space: Math.min(distToSouth, distToEast) },
    { bearing: 180, space: distToSouth },   // South
    { bearing: 225, space: Math.min(distToSouth, distToWest) },
    { bearing: 270, space: distToWest },    // West
    { bearing: 315, space: Math.min(distToNorth, distToWest) },
  ];

  // Sort by available space (most space first) and add some randomness
  return directions
    .sort((a, b) => b.space - a.space)
    .map(d => d.bearing);
}

/**
 * Generate a random circle center that is NOT on the target location
 * but guarantees the target is within the circle's radius.
 *
 * The center is placed away from the target, preferring directions
 * that keep the entire circle within the country bounds.
 */
export function generateHintCircleCenter(
  targetLat: number,
  targetLng: number,
  radiusKm: number = 60,
  country: string = DEFAULT_COUNTRY
): { lat: number; lng: number } {
  // Use full range of possible offsets for unpredictability
  // Target can be anywhere in the circle - near center OR near edge
  const minBuffer = 5; // Minimum distance so target isn't exactly at center
  const minDistance = minBuffer;
  const maxDistance = radiusKm - minBuffer;

  // Get bearings sorted by available space
  const bestBearings = getBestBearings(targetLat, targetLng, country);

  // Try each bearing direction, starting with best options
  for (const baseBearing of bestBearings) {
    // Add randomness to the bearing (+/- 30 degrees for more variety)
    const bearing = baseBearing + (Math.random() * 60 - 30);
    // Full range: target can be 5km to 55km from center (for 60km radius)
    const distance = minDistance + Math.random() * (maxDistance - minDistance);

    const center = calculateDestination(targetLat, targetLng, distance, bearing);

    // Check if this circle stays within bounds
    if (isCircleWithinBounds(center.lat, center.lng, radiusKm, country)) {
      return center;
    }
  }

  // Fallback: if no direction works perfectly, use the best direction anyway
  const bestBearing = bestBearings[0] + (Math.random() * 60 - 30);
  const distance = minDistance + Math.random() * (maxDistance - minDistance);

  return calculateDestination(targetLat, targetLng, distance, bestBearing);
}

export const HINT_CIRCLE_RADIUS_KM = 60;
