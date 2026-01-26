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
  landmarkImage: string | null;
  backgroundImage: string | null;
  cardImage: string | null;
  flagImage: string | null;
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
  locationCount?: number;
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
    landmarkImage: country.landmarkImage,
    backgroundImage: country.backgroundImage,
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
    locationCount: country.locationCount,
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
  description: string | null;
  descriptionEn: string | null;
  landmarkImage: string | null;
  backgroundImage: string | null;
  centerLat: number;
  centerLng: number;
  defaultZoom: number;
  minZoom: number;
  timeoutPenalty: number;
  scoreScaleFactor: number;
  isActive: boolean;
  locationCount?: number;
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
    description: worldQuiz.description ? {
      de: worldQuiz.description,
      en: worldQuiz.descriptionEn || worldQuiz.description,
      sl: worldQuiz.description,
    } : undefined,
    landmarkImage: worldQuiz.landmarkImage,
    backgroundImage: worldQuiz.backgroundImage,
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
    locationCount: worldQuiz.locationCount,
  };
}

/**
 * Database PanoramaType type (from API response)
 */
export interface DatabasePanoramaType {
  id: string;
  name: string;
  nameEn: string | null;
  nameSl: string | null;
  icon: string;
  landmarkImage: string | null;
  backgroundImage: string | null;
  centerLat: number;
  centerLng: number;
  defaultZoom: number;
  minZoom: number;
  timeoutPenalty: number;
  scoreScaleFactor: number;
  defaultTimeLimitSeconds: number;
  isActive: boolean;
  locationCount?: number;
}

/**
 * Convert a database panorama type to a GameTypeConfig
 * This allows dynamic panorama types from the DB to be used alongside static GAME_TYPES
 */
export function panoramaToGameTypeConfig(panorama: DatabasePanoramaType): GameTypeConfig {
  return {
    id: `panorama:${panorama.id}`,
    type: "panorama",
    name: {
      de: panorama.name,
      en: panorama.nameEn || panorama.name,
      sl: panorama.nameSl || panorama.name,
    },
    icon: panorama.icon,
    landmarkImage: panorama.landmarkImage,
    backgroundImage: panorama.backgroundImage,
    geoJsonFile: "/world.geojson", // All panorama games use the world map
    bounds: null, // World maps have no bounds
    timeoutPenalty: panorama.timeoutPenalty,
    scoreScaleFactor: panorama.scoreScaleFactor,
    defaultZoom: panorama.defaultZoom,
    minZoom: panorama.minZoom,
    defaultCenter: {
      lat: panorama.centerLat,
      lng: panorama.centerLng,
    },
    defaultTimeLimitSeconds: panorama.defaultTimeLimitSeconds,
    locationCount: panorama.locationCount,
  };
}
