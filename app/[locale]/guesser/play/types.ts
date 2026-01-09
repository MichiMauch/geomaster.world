export interface GameRound {
  id: string;
  roundNumber: number;
  locationIndex: number;
  locationId: string;
  locationName: string;
  latitude: number;
  longitude: number;
  country: string;
  gameType?: string | null;
  timeLimitSeconds?: number | null;
  // Panorama-specific fields
  mapillaryImageKey?: string | null;
  heading?: number | null;
  pitch?: number | null;
}

export interface Guess {
  gameRoundId: string;
  distanceKm: number;
  score: number;
  roundNumber: number;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Game {
  id: string;
  status: string;
  currentRound: number;
  country: string;
  gameType?: string | null;
  timeLimitSeconds?: number | null;
}

export interface DynamicCountry {
  id: string;
  centerLat: number;
  centerLng: number;
  boundsNorth: number | null;
  boundsSouth: number | null;
  boundsEast: number | null;
  boundsWest: number | null;
  defaultZoom: number;
  minZoom: number;
}

export interface DynamicWorldQuiz {
  id: string;
  centerLat: number;
  centerLng: number;
  defaultZoom: number;
  minZoom: number;
}

export interface GuessResult {
  distanceKm: number;
  score: number;
  targetLat: number;
  targetLng: number;
  insideCountry?: boolean;
  targetCountryCode?: string;
}

export interface LevelUpInfo {
  newLevel: number;
  newLevelName: string;
}
