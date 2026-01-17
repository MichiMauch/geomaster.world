export interface MarkerPosition {
  lat: number;
  lng: number;
}

export interface HintCircle {
  lat: number;
  lng: number;
  radiusKm: number;
}

// Dynamic country config for database-stored countries
export interface DynamicCountryConfig {
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

// Dynamic world quiz config for database-stored world quiz types
export interface DynamicWorldQuizConfig {
  id: string;
  centerLat: number;
  centerLng: number;
  defaultZoom: number;
  minZoom: number;
}

export interface CountryMapProps {
  gameType?: string;
  country?: string; // Legacy support - will be converted to gameType
  dynamicCountry?: DynamicCountryConfig; // For database-stored countries (overrides gameType)
  dynamicWorldQuiz?: DynamicWorldQuizConfig; // For database-stored world quiz types
  onMarkerPlace?: (position: MarkerPosition) => void;
  markerPosition?: MarkerPosition | null;
  targetPosition?: MarkerPosition | null;
  showTarget?: boolean;
  interactive?: boolean;
  height?: string;
  hintCircle?: HintCircle | null;
  onReady?: () => void; // Called when map is fully loaded and visible
  roundId?: string; // Unique ID per round to trigger onReady reset
}
