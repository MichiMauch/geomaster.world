/**
 * GeoJSON Utility Functions
 * For extracting bounds, center, and calculating scoring parameters from GeoJSON
 */

export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface Center {
  lat: number;
  lng: number;
}

export interface ScoringParams {
  timeoutPenalty: number;
  scoreScaleFactor: number;
}

export interface ZoomLevels {
  defaultZoom: number;
  minZoom: number;
}

/**
 * Extract all coordinates from a GeoJSON object (handles nested structures)
 */
function extractCoordinates(geojson: unknown): number[][] {
  const coords: number[][] = [];

  function traverse(obj: unknown): void {
    if (Array.isArray(obj)) {
      // Check if this is a coordinate pair [lng, lat]
      if (obj.length >= 2 && typeof obj[0] === "number" && typeof obj[1] === "number") {
        // Validate coordinates are in valid range
        const lng = obj[0];
        const lat = obj[1];
        if (lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
          coords.push([lng, lat]);
        }
      }
      // Recurse into nested arrays
      for (const item of obj) {
        traverse(item);
      }
    } else if (obj && typeof obj === "object") {
      // Recurse into object properties
      for (const value of Object.values(obj)) {
        traverse(value);
      }
    }
  }

  traverse(geojson);
  return coords;
}

/**
 * Extract bounds (north, south, east, west) from a GeoJSON object
 */
export function extractBoundsFromGeoJSON(geojsonString: string): Bounds {
  const geojson = JSON.parse(geojsonString);
  const coords = extractCoordinates(geojson);

  if (coords.length === 0) {
    throw new Error("No valid coordinates found in GeoJSON");
  }

  const lngs = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);

  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs),
  };
}

/**
 * Calculate center point from bounds
 */
export function calculateCenterFromBounds(bounds: Bounds): Center {
  return {
    lat: (bounds.north + bounds.south) / 2,
    lng: (bounds.east + bounds.west) / 2,
  };
}

/**
 * Calculate Haversine distance between two points in km
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Calculate diagonal distance of bounds in km
 */
export function calculateDiagonal(bounds: Bounds): number {
  return haversineDistance(
    bounds.south,
    bounds.west,
    bounds.north,
    bounds.east
  );
}

/**
 * Calculate scoring parameters based on country size
 * Based on existing values:
 * - Slovenia: ~200km diagonal → timeoutPenalty: 250, scoreScaleFactor: 60
 * - Switzerland: ~350km diagonal → timeoutPenalty: 400, scoreScaleFactor: 100
 */
export function calculateScoringParams(bounds: Bounds): ScoringParams {
  const diagonal = calculateDiagonal(bounds);

  // Formulas derived from existing countries
  // timeoutPenalty ~= diagonal * 1.0-1.2
  // scoreScaleFactor ~= diagonal * 0.25-0.3
  return {
    timeoutPenalty: Math.round(diagonal * 1.0),
    scoreScaleFactor: Math.round(diagonal * 0.28),
  };
}

/**
 * Calculate appropriate zoom levels based on country size
 * Smaller countries need higher zoom (more zoomed in)
 */
export function calculateZoomLevels(bounds: Bounds): ZoomLevels {
  const diagonal = calculateDiagonal(bounds);

  // Approximate zoom levels based on diagonal
  // Very small (<100km): zoom 10
  // Small (100-300km): zoom 8-9
  // Medium (300-1000km): zoom 6-7
  // Large (1000-3000km): zoom 4-5
  // Very large (>3000km): zoom 2-3
  let defaultZoom: number;
  let minZoom: number;

  if (diagonal < 100) {
    defaultZoom = 10;
    minZoom = 8;
  } else if (diagonal < 300) {
    defaultZoom = 9;
    minZoom = 7;
  } else if (diagonal < 600) {
    defaultZoom = 8;
    minZoom = 6;
  } else if (diagonal < 1000) {
    defaultZoom = 7;
    minZoom = 5;
  } else if (diagonal < 2000) {
    defaultZoom = 6;
    minZoom = 4;
  } else if (diagonal < 4000) {
    defaultZoom = 5;
    minZoom = 3;
  } else {
    defaultZoom = 4;
    minZoom = 2;
  }

  return { defaultZoom, minZoom };
}

/**
 * Parse GeoJSON and extract all relevant data for a country
 */
export function parseGeoJSONForCountry(geojsonString: string): {
  bounds: Bounds;
  center: Center;
  scoring: ScoringParams;
  zoom: ZoomLevels;
  diagonal: number;
} {
  const bounds = extractBoundsFromGeoJSON(geojsonString);
  const center = calculateCenterFromBounds(bounds);
  const scoring = calculateScoringParams(bounds);
  const zoom = calculateZoomLevels(bounds);
  const diagonal = calculateDiagonal(bounds);

  return { bounds, center, scoring, zoom, diagonal };
}
