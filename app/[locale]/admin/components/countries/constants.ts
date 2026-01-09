import type { EmojiOption } from "@/components/ui/EmojiPicker";

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

// Parse GeoJSON and extract name, bounds, center
export function parseGeoJson(geoJson: object, fileName: string): ParsedGeoJson {
  const coords = extractCoordinates(geoJson);

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
  const geoJsonTyped = geoJson as {
    features?: Array<{ properties?: { name?: string; NAME?: string } }>;
    properties?: { name?: string; NAME?: string };
  };

  if (geoJsonTyped.features && geoJsonTyped.features[0]?.properties) {
    const props = geoJsonTyped.features[0].properties;
    name = props.name || props.NAME || "";
  } else if (geoJsonTyped.properties) {
    name = geoJsonTyped.properties.name || geoJsonTyped.properties.NAME || "";
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
  };
}
