import { CountryBounds, COUNTRIES } from "./countries";

export interface GameTypeConfig {
  id: string;
  type: "country" | "world";
  name: { de: string; en: string; sl: string };
  icon: string;
  geoJsonFile: string;
  bounds: CountryBounds | null; // null = world map (no bounds)
  timeoutPenalty: number; // km
  scoreScaleFactor: number; // km at which you get ~37% of max points (e^-1)
  defaultZoom: number;
  minZoom: number;
  defaultCenter: { lat: number; lng: number };
}

export const GAME_TYPES: Record<string, GameTypeConfig> = {
  // Country-based game types (using existing country configs)
  "country:switzerland": {
    id: "country:switzerland",
    type: "country",
    name: { de: "Schweiz", en: "Switzerland", sl: "Švica" },
    icon: "🇨🇭",
    geoJsonFile: "/switzerland.geojson",
    bounds: COUNTRIES.switzerland.bounds,
    timeoutPenalty: 400,
    scoreScaleFactor: 100, // ~350km country
    defaultZoom: 8,
    minZoom: 7,
    defaultCenter: COUNTRIES.switzerland.bounds.center,
  },
  "country:slovenia": {
    id: "country:slovenia",
    type: "country",
    name: { de: "Slowenien", en: "Slovenia", sl: "Slovenija" },
    icon: "🇸🇮",
    geoJsonFile: "/slovenia.geojson",
    bounds: COUNTRIES.slovenia.bounds,
    timeoutPenalty: 250,
    scoreScaleFactor: 60, // ~200km country
    defaultZoom: 8,
    minZoom: 7,
    defaultCenter: COUNTRIES.slovenia.bounds.center,
  },
  // World-based game types
  "world:highest-mountains": {
    id: "world:highest-mountains",
    type: "world",
    name: { de: "Höchste Berge", en: "Highest Mountains", sl: "Najvišje gore" },
    icon: "🏔️",
    geoJsonFile: "/world.geojson",
    bounds: null,
    timeoutPenalty: 5000,
    scoreScaleFactor: 3000, // World map
    defaultZoom: 2,
    minZoom: 1,
    defaultCenter: { lat: 20, lng: 0 },
  },
  "world:capitals": {
    id: "world:capitals",
    type: "world",
    name: { de: "Hauptstädte", en: "World Capitals", sl: "Prestolnice" },
    icon: "🏛️",
    geoJsonFile: "/world.geojson",
    bounds: null,
    timeoutPenalty: 5000,
    scoreScaleFactor: 3000, // World map
    defaultZoom: 2,
    minZoom: 1,
    defaultCenter: { lat: 20, lng: 0 },
  },
  "world:famous-places": {
    id: "world:famous-places",
    type: "world",
    name: { de: "Berühmte Orte", en: "Famous Places", sl: "Znamenite lokacije" },
    icon: "🗺️",
    geoJsonFile: "/world.geojson",
    bounds: null,
    timeoutPenalty: 5000,
    scoreScaleFactor: 3000, // World map
    defaultZoom: 2,
    minZoom: 1,
    defaultCenter: { lat: 20, lng: 0 },
  },
  "world:unesco": {
    id: "world:unesco",
    type: "world",
    name: { de: "UNESCO Welterbe", en: "UNESCO World Heritage", sl: "UNESCO svetovna dediščina" },
    icon: "🏛️",
    geoJsonFile: "/world.geojson",
    bounds: null,
    timeoutPenalty: 5000,
    scoreScaleFactor: 3000, // World map
    defaultZoom: 2,
    minZoom: 1,
    defaultCenter: { lat: 20, lng: 0 },
  },
  "world:airports": {
    id: "world:airports",
    type: "world",
    name: { de: "Internationale Flughäfen", en: "International Airports", sl: "Mednarodna letališča" },
    icon: "✈️",
    geoJsonFile: "/world.geojson",
    bounds: null,
    timeoutPenalty: 5000,
    scoreScaleFactor: 3000, // World map
    defaultZoom: 2,
    minZoom: 1,
    defaultCenter: { lat: 20, lng: 0 },
  },
};

export const DEFAULT_GAME_TYPE = "country:switzerland";

/**
 * Get game type config by ID
 */
export function getGameTypeConfig(gameTypeId: string): GameTypeConfig {
  return GAME_TYPES[gameTypeId] || GAME_TYPES[DEFAULT_GAME_TYPE];
}

/**
 * Get game type from legacy country field
 * Converts old "switzerland" to new "country:switzerland" format
 */
export function getGameTypeFromCountry(country: string): string {
  return `country:${country}`;
}

/**
 * Get the effective game type ID from a game
 * Uses gameType if set, otherwise falls back to country field
 */
export function getEffectiveGameType(game: { gameType?: string | null; country: string }): string {
  return game.gameType || getGameTypeFromCountry(game.country);
}

/**
 * Get all available game type IDs
 */
export function getGameTypeIds(): string[] {
  return Object.keys(GAME_TYPES);
}

/**
 * Get game types grouped by type
 */
export function getGameTypesByType(): { country: GameTypeConfig[]; world: GameTypeConfig[] } {
  const country: GameTypeConfig[] = [];
  const world: GameTypeConfig[] = [];

  for (const config of Object.values(GAME_TYPES)) {
    if (config.type === "country") {
      country.push(config);
    } else {
      world.push(config);
    }
  }

  return { country, world };
}

/**
 * Get game type name in the specified locale
 */
export function getGameTypeName(gameTypeId: string, locale: string): string {
  const config = getGameTypeConfig(gameTypeId);
  return config.name[locale as keyof typeof config.name] || config.name.en;
}

/**
 * Check if a game type is a world type
 */
export function isWorldGameType(gameTypeId: string | null | undefined): boolean {
  if (!gameTypeId) return false;
  return gameTypeId.startsWith("world:");
}

/**
 * Get the category from a world game type ID
 * e.g., "world:capitals" -> "capitals"
 */
export function getWorldCategory(gameTypeId: string): string | null {
  if (!isWorldGameType(gameTypeId)) return null;
  return gameTypeId.split(":")[1];
}
