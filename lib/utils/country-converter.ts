import type { GameTypeConfig } from "@/lib/game-types";

/**
 * Database Country type (from API response)
 */
export interface DatabaseCountry {
  id: string;
  name: string;
  nameEn: string | null;
  nameSl: string | null;
  icon: string;
  centerLat: number;
  centerLng: number;
  defaultZoom: number;
  minZoom: number;
  boundsNorth: number | null;
  boundsSouth: number | null;
  boundsEast: number | null;
  boundsWest: number | null;
  timeoutPenalty: number;
  scoreScaleFactor: number;
  isActive: boolean;
}

/**
 * Convert a database country to a GameTypeConfig
 * This allows dynamic countries from the DB to be used alongside static GAME_TYPES
 */
export function countryToGameTypeConfig(country: DatabaseCountry): GameTypeConfig {
  const hasBounds =
    country.boundsNorth !== null &&
    country.boundsSouth !== null &&
    country.boundsEast !== null &&
    country.boundsWest !== null;

  return {
    id: `country:${country.id}`,
    type: "country",
    name: {
      de: country.name,
      en: country.nameEn || country.name,
      sl: country.nameSl || country.name,
    },
    icon: country.icon,
    geoJsonFile: `/${country.id}.geojson`,
    bounds: hasBounds
      ? {
          southWest: {
            lat: country.boundsSouth!,
            lng: country.boundsWest!,
          },
          northEast: {
            lat: country.boundsNorth!,
            lng: country.boundsEast!,
          },
          center: {
            lat: country.centerLat,
            lng: country.centerLng,
          },
        }
      : null,
    timeoutPenalty: country.timeoutPenalty,
    scoreScaleFactor: country.scoreScaleFactor,
    defaultZoom: country.defaultZoom,
    minZoom: country.minZoom,
    defaultCenter: {
      lat: country.centerLat,
      lng: country.centerLng,
    },
  };
}

/**
 * Convert multiple database countries to GameTypeConfigs
 */
export function countriesToGameTypeConfigs(countries: DatabaseCountry[]): GameTypeConfig[] {
  return countries.map(countryToGameTypeConfig);
}

/**
 * Filter for only active countries
 */
export function getActiveCountries(countries: DatabaseCountry[]): DatabaseCountry[] {
  return countries.filter((c) => c.isActive);
}

/**
 * Database WorldQuizType type (from API response)
 */
export interface DatabaseWorldQuizType {
  id: string;
  name: string;
  nameEn: string | null;
  nameSl: string | null;
  icon: string;
  centerLat: number;
  centerLng: number;
  defaultZoom: number;
  minZoom: number;
  timeoutPenalty: number;
  scoreScaleFactor: number;
  isActive: boolean;
}

/**
 * Convert a database world quiz type to a GameTypeConfig
 * This allows dynamic world quiz types from the DB to be used alongside static GAME_TYPES
 */
export function worldQuizToGameTypeConfig(worldQuiz: DatabaseWorldQuizType): GameTypeConfig {
  return {
    id: `world:${worldQuiz.id}`,
    type: "world",
    name: {
      de: worldQuiz.name,
      en: worldQuiz.nameEn || worldQuiz.name,
      sl: worldQuiz.nameSl || worldQuiz.name,
    },
    icon: worldQuiz.icon,
    geoJsonFile: "/world.geojson", // All world quizzes use the same world map
    bounds: null, // World maps have no bounds
    timeoutPenalty: worldQuiz.timeoutPenalty,
    scoreScaleFactor: worldQuiz.scoreScaleFactor,
    defaultZoom: worldQuiz.defaultZoom,
    minZoom: worldQuiz.minZoom,
    defaultCenter: {
      lat: worldQuiz.centerLat,
      lng: worldQuiz.centerLng,
    },
  };
}
