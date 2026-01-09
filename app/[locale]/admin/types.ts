export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
  memberCount: number;
  gameCount: number;
}

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  hintEnabled: boolean | null;
  isSuperAdmin: boolean | null;
  createdAt: string;
  groupCount: number;
  guessCount: number;
}

export interface Location {
  id: string;
  name: string;
  nameDe: string | null;
  nameEn: string | null;
  nameSl: string | null;
  latitude: number;
  longitude: number;
  difficulty: string;
}

export interface ImageLocation {
  id: string;
  imageMapId: string;
  name: string;
  x: number;
  y: number;
  difficulty: string;
}

export interface Country {
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
  createdAt: Date;
  locationCount: number;
}

export interface WorldQuizType {
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
  createdAt: Date;
  locationCount: number;
}

export type AdminTab = "groups" | "users" | "countries" | "world-quiz-types" | "locations" | "world-locations" | "image-locations" | "logs";

export interface WorldLocation {
  id: string;
  category: string;
  name: string;
  nameDe: string | null;
  nameEn: string | null;
  nameSl: string | null;
  latitude: number;
  longitude: number;
  countryCode: string | null;
  difficulty: string;
}

export interface TranslationStatus {
  untranslatedCount: number;
  totalCount: number;
  translatedCount: number;
}

export interface TranslationResult {
  success: boolean;
  translated: number;
  failed: number;
  total: number;
  errors?: string[];
  message?: string;
}
