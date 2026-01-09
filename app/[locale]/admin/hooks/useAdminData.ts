import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useGroupAdmin } from "./useGroupAdmin";
import { useUserAdmin } from "./useUserAdmin";
import { useCountryAdmin } from "./useCountryAdmin";
import { useWorldQuizAdmin } from "./useWorldQuizAdmin";
import { useLocationAdmin } from "./useLocationAdmin";
import type { Country, WorldQuizType, TranslationStatus, TranslationResult } from "../types";

/**
 * Combined admin data hook that composes specialized admin hooks.
 * This hook fetches initial data and provides all admin actions.
 *
 * For new code, consider using the specialized hooks directly:
 * - useGroupAdmin() for group management
 * - useUserAdmin() for user management
 * - useCountryAdmin() for country management
 * - useWorldQuizAdmin() for world quiz types and locations
 * - useLocationAdmin() for country locations and image locations
 */

interface UseAdminDataReturn {
  // Data
  groups: ReturnType<typeof useGroupAdmin>["groups"];
  users: ReturnType<typeof useUserAdmin>["users"];
  countries: ReturnType<typeof useCountryAdmin>["countries"];
  worldQuizTypes: ReturnType<typeof useWorldQuizAdmin>["worldQuizTypes"];
  locations: ReturnType<typeof useLocationAdmin>["locations"];
  worldLocations: ReturnType<typeof useWorldQuizAdmin>["worldLocations"];
  imageLocations: ReturnType<typeof useLocationAdmin>["imageLocations"];
  loading: boolean;
  // Group actions
  deleteGroup: ReturnType<typeof useGroupAdmin>["deleteGroup"];
  // User actions
  deleteUser: ReturnType<typeof useUserAdmin>["deleteUser"];
  toggleHint: ReturnType<typeof useUserAdmin>["toggleHint"];
  toggleSuperAdmin: ReturnType<typeof useUserAdmin>["toggleSuperAdmin"];
  // Country actions
  addCountry: (country: Omit<Country, "createdAt" | "locationCount"> & { geoJsonData?: string }) => Promise<boolean>;
  deleteCountry: (countryId: string) => Promise<void>;
  updateCountry: (countryId: string, data: Partial<Country>) => Promise<boolean>;
  refreshCountries: () => Promise<void>;
  // World Quiz Type actions
  addWorldQuizType: (quizType: Omit<WorldQuizType, "createdAt" | "locationCount">) => Promise<boolean>;
  deleteWorldQuizType: (quizTypeId: string) => Promise<void>;
  updateWorldQuizType: (quizTypeId: string, data: Partial<WorldQuizType>) => Promise<boolean>;
  refreshWorldQuizTypes: () => Promise<void>;
  // World Location actions
  addWorldLocation: (category: string, name: string, lat: number, lng: number, countryCode: string, difficulty: string) => Promise<boolean>;
  deleteWorldLocation: (locationId: string) => Promise<void>;
  importWorldLocations: (locations: unknown[], category: string) => Promise<{ imported: number; duplicatesSkipped: number }>;
  fetchWorldLocationsByCategory: (category: string) => Promise<void>;
  // World location translation actions
  translateWorldLocations: (category: string) => Promise<TranslationResult>;
  fetchWorldLocationTranslationStatus: (category: string) => Promise<TranslationStatus>;
  // Location actions
  addLocation: (country: string, name: string, lat: number, lng: number, difficulty: string) => Promise<boolean>;
  deleteLocation: (locationId: string) => Promise<void>;
  importLocations: (locations: unknown[], country: string) => Promise<{ imported: number; duplicatesSkipped: number }>;
  refreshLocations: () => Promise<void>;
  fetchLocationsByCountry: (countryNameEn: string) => Promise<void>;
  // Image location actions
  fetchImageLocations: (imageMapId: string) => Promise<void>;
  addImageLocation: (imageMapId: string, name: string, x: number, y: number, difficulty: string) => Promise<boolean>;
  deleteImageLocation: (locationId: string) => Promise<void>;
  // Translation actions
  translateLocations: (country: string) => Promise<TranslationResult>;
  fetchTranslationStatus: (country: string) => Promise<TranslationStatus>;
}

export function useAdminData(): UseAdminDataReturn {
  const [initialLoading, setInitialLoading] = useState(true);

  // Compose specialized hooks
  const groupAdmin = useGroupAdmin();
  const userAdmin = useUserAdmin();
  const countryAdmin = useCountryAdmin();
  const worldQuizAdmin = useWorldQuizAdmin();
  const locationAdmin = useLocationAdmin();

  // Initial data fetch
  useEffect(() => {
    const fetchAllData = async () => {
      setInitialLoading(true);
      try {
        await Promise.all([
          groupAdmin.fetchGroups(),
          userAdmin.fetchUsers(),
          countryAdmin.fetchCountries(),
          worldQuizAdmin.fetchWorldQuizTypes(),
          locationAdmin.fetchLocations(),
        ]);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast.error("Fehler beim Laden der Daten");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Combined loading state
  const loading = initialLoading ||
    groupAdmin.loading ||
    userAdmin.loading ||
    countryAdmin.loading ||
    worldQuizAdmin.loading ||
    locationAdmin.loading;

  return {
    // Data from hooks
    groups: groupAdmin.groups,
    users: userAdmin.users,
    countries: countryAdmin.countries,
    worldQuizTypes: worldQuizAdmin.worldQuizTypes,
    locations: locationAdmin.locations,
    worldLocations: worldQuizAdmin.worldLocations,
    imageLocations: locationAdmin.imageLocations,
    loading,

    // Group actions
    deleteGroup: groupAdmin.deleteGroup,

    // User actions
    deleteUser: userAdmin.deleteUser,
    toggleHint: userAdmin.toggleHint,
    toggleSuperAdmin: userAdmin.toggleSuperAdmin,

    // Country actions
    addCountry: countryAdmin.addCountry,
    deleteCountry: countryAdmin.deleteCountry,
    updateCountry: countryAdmin.updateCountry,
    refreshCountries: countryAdmin.refreshCountries,

    // World Quiz Type actions
    addWorldQuizType: worldQuizAdmin.addWorldQuizType,
    deleteWorldQuizType: worldQuizAdmin.deleteWorldQuizType,
    updateWorldQuizType: worldQuizAdmin.updateWorldQuizType,
    refreshWorldQuizTypes: worldQuizAdmin.refreshWorldQuizTypes,

    // World Location actions
    addWorldLocation: worldQuizAdmin.addWorldLocation,
    deleteWorldLocation: worldQuizAdmin.deleteWorldLocation,
    importWorldLocations: worldQuizAdmin.importWorldLocations,
    fetchWorldLocationsByCategory: worldQuizAdmin.fetchWorldLocationsByCategory,
    translateWorldLocations: worldQuizAdmin.translateWorldLocations,
    fetchWorldLocationTranslationStatus: worldQuizAdmin.fetchWorldLocationTranslationStatus,

    // Location actions
    addLocation: locationAdmin.addLocation,
    deleteLocation: locationAdmin.deleteLocation,
    importLocations: locationAdmin.importLocations,
    refreshLocations: locationAdmin.refreshLocations,
    fetchLocationsByCountry: locationAdmin.fetchLocationsByCountry,

    // Image location actions
    fetchImageLocations: locationAdmin.fetchImageLocations,
    addImageLocation: locationAdmin.addImageLocation,
    deleteImageLocation: locationAdmin.deleteImageLocation,

    // Translation actions
    translateLocations: locationAdmin.translateLocations,
    fetchTranslationStatus: locationAdmin.fetchTranslationStatus,
  };
}

// Re-export specialized hooks for direct usage
export { useGroupAdmin } from "./useGroupAdmin";
export { useUserAdmin } from "./useUserAdmin";
export { useCountryAdmin } from "./useCountryAdmin";
export { useWorldQuizAdmin } from "./useWorldQuizAdmin";
export { useLocationAdmin } from "./useLocationAdmin";
