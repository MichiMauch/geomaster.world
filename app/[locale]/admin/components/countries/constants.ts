import type { EmojiOption } from "@/components/ui/EmojiPicker";
import * as topojson from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";

export const FLAG_OPTIONS: EmojiOption[] = [
  { emoji: "🇨🇭", label: "Schweiz" },
  { emoji: "🇩🇪", label: "Deutschland" },
  { emoji: "🇦🇹", label: "Österreich" },
  { emoji: "🇫🇷", label: "Frankreich" },
  { emoji: "🇮🇹", label: "Italien" },
  { emoji: "🇪🇸", label: "Spanien" },
  { emoji: "🇬🇧", label: "UK" },
  { emoji: "🇳🇱", label: "Niederlande" },
  { emoji: "🇧🇪", label: "Belgien" },
  { emoji: "🇵🇱", label: "Polen" },
  { emoji: "🇨🇿", label: "Tschechien" },
  { emoji: "🇸🇮", label: "Slowenien" },
  { emoji: "🇭🇺", label: "Ungarn" },
  { emoji: "🇸🇰", label: "Slowakei" },
  { emoji: "🇭🇷", label: "Kroatien" },
  { emoji: "🇷🇴", label: "Rumänien" },
  { emoji: "🇧🇬", label: "Bulgarien" },
  { emoji: "🇬🇷", label: "Griechenland" },
  { emoji: "🇵🇹", label: "Portugal" },
  { emoji: "🇸🇪", label: "Schweden" },
  { emoji: "🇳🇴", label: "Norwegen" },
  { emoji: "🇩🇰", label: "Dänemark" },
  { emoji: "🇫🇮", label: "Finnland" },
  { emoji: "🇮🇪", label: "Irland" },
  { emoji: "🇱🇺", label: "Luxemburg" },
  { emoji: "🇱🇮", label: "Liechtenstein" },
  { emoji: "🇲🇨", label: "Monaco" },
  { emoji: "🇺🇸", label: "USA" },
  { emoji: "🇨🇦", label: "Kanada" },
  { emoji: "🇯🇵", label: "Japan" },
  { emoji: "🇦🇺", label: "Australien" },
  { emoji: "🇧🇷", label: "Brasilien" },
  { emoji: "🌍", label: "Welt" },
  { emoji: "🏴", label: "Andere" },
];

export interface ParsedGeoJson {
  name: string;
  id: string;
  bounds: { north: number; south: number; east: number; west: number };
  center: { lat: number; lng: number };
  /** The GeoJSON data (converted from TopoJSON if necessary) */
  geoJsonData?: string;
}

/**
 * Check if an object is a TopoJSON Topology
 */
function isTopoJson(obj: unknown): obj is Topology {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "type" in obj &&
    (obj as { type: string }).type === "Topology" &&
    "objects" in obj
  );
}

/**
 * Convert TopoJSON to GeoJSON FeatureCollection
 * Takes the first object in the topology
 */
function topoJsonToGeoJson(topo: Topology): GeoJSON.FeatureCollection {
  const objectKeys = Object.keys(topo.objects);
  if (objectKeys.length === 0) {
    throw new Error("TopoJSON enthält keine Objekte");
  }

  // Use the first object
  const firstKey = objectKeys[0];
  const geomCollection = topo.objects[firstKey] as GeometryCollection;

  // Convert to GeoJSON
  return topojson.feature(topo, geomCollection) as GeoJSON.FeatureCollection;
}

// Recursively extract all coordinates from GeoJSON
function extractCoordinates(obj: unknown): [number, number][] {
  const coords: [number, number][] = [];

  if (Array.isArray(obj)) {
    if (obj.length >= 2 && typeof obj[0] === "number" && typeof obj[1] === "number") {
      coords.push([obj[0], obj[1]]);
    } else {
      for (const item of obj) {
        coords.push(...extractCoordinates(item));
      }
    }
  } else if (obj && typeof obj === "object") {
    for (const value of Object.values(obj)) {
      coords.push(...extractCoordinates(value));
    }
  }

  return coords;
}

// Parse GeoJSON (or TopoJSON) and extract name, bounds, center
export function parseGeoJson(geoJson: object, fileName: string): ParsedGeoJson {
  // Convert TopoJSON to GeoJSON if needed
  let workingGeoJson: object = geoJson;
  let convertedGeoJsonData: string | undefined;

  if (isTopoJson(geoJson)) {
    const converted = topoJsonToGeoJson(geoJson);
    workingGeoJson = converted;
    convertedGeoJsonData = JSON.stringify(converted);
  }

  const coords = extractCoordinates(workingGeoJson);

  if (coords.length === 0) {
    throw new Error("Keine Koordinaten im GeoJSON gefunden");
  }

  let minLng = Infinity, maxLng = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;

  for (const [lng, lat] of coords) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  let name = "";
  const geoJsonTyped = workingGeoJson as {
    features?: Array<{ properties?: { name?: string; NAME?: string; NAME_0?: string } }>;
    properties?: { name?: string; NAME?: string; NAME_0?: string };
  };

  if (geoJsonTyped.features && geoJsonTyped.features[0]?.properties) {
    const props = geoJsonTyped.features[0].properties;
    name = props.name || props.NAME || props.NAME_0 || "";
  } else if (geoJsonTyped.properties) {
    name = geoJsonTyped.properties.name || geoJsonTyped.properties.NAME || geoJsonTyped.properties.NAME_0 || "";
  }

  if (!name) {
    name = fileName.replace(/\.(geo)?json$/i, "").replace(/[-_]/g, " ");
    name = name.charAt(0).toUpperCase() + name.slice(1);
  }

  const id = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  return {
    name,
    id,
    bounds: { north: maxLat, south: minLat, east: maxLng, west: minLng },
    center: { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 },
    geoJsonData: convertedGeoJsonData,
  };
}

/**
 * Calculate distance between two points using Haversine formula
 * @returns Distance in kilometers
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate the diagonal distance of a bounding box in kilometers
 */
export function calculateBoundsDiagonalKm(
  bounds: ParsedGeoJson["bounds"]
): number {
  return haversineDistance(
    bounds.south,
    bounds.west,
    bounds.north,
    bounds.east
  );
}

/**
 * Calculate suggested scoring parameters based on bounds
 * Based on reference values:
 * - Switzerland (~350 km diagonal): timeoutPenalty=400, scoreScaleFactor=100
 * - Slovenia (~200 km diagonal): timeoutPenalty=250, scoreScaleFactor=60
 */
export function calculateSuggestedScoringParams(
  bounds: ParsedGeoJson["bounds"]
): {
  timeoutPenalty: number;
  scoreScaleFactor: number;
} {
  const diagonal = calculateBoundsDiagonalKm(bounds);

  // timeoutPenalty ≈ diagonal * 1.2, rounded to nearest 10
  const timeoutPenalty = Math.round((diagonal * 1.2) / 10) * 10;

  // scoreScaleFactor ≈ diagonal * 0.3, rounded to nearest 5
  const scoreScaleFactor = Math.round((diagonal * 0.3) / 5) * 5;

  return {
    timeoutPenalty: Math.max(timeoutPenalty, 50), // Minimum 50 km
    scoreScaleFactor: Math.max(scoreScaleFactor, 15), // Minimum 15 km
  };
}
