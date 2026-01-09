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
}

export interface GuessResult {
  distanceKm: number;
  score: number;
  targetLat: number;
  targetLng: number;
}

export interface HintCircle {
  lat: number;
  lng: number;
  radiusKm: number;
}

export type TimerState = "normal" | "warning" | "critical";
