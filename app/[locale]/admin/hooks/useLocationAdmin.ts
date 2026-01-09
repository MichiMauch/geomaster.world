import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import type { Location, ImageLocation, TranslationStatus, TranslationResult } from "../types";

interface UseLocationAdminReturn {
  locations: Location[];
  imageLocations: ImageLocation[];
  loading: boolean;
  setLocations: React.Dispatch<React.SetStateAction<Location[]>>;
  setImageLocations: React.Dispatch<React.SetStateAction<ImageLocation[]>>;
  // Country Location actions
  addLocation: (country: string, name: string, lat: number, lng: number, difficulty: string) => Promise<boolean>;
  deleteLocation: (locationId: string) => Promise<void>;
  importLocations: (locations: unknown[], country: string) => Promise<{ imported: number; duplicatesSkipped: number }>;
  refreshLocations: () => Promise<void>;
  fetchLocations: () => Promise<void>;
  fetchLocationsByCountry: (countryNameEn: string) => Promise<void>;
  // Translation actions
  translateLocations: (country: string) => Promise<TranslationResult>;
  fetchTranslationStatus: (country: string) => Promise<TranslationStatus>;
  // Image location actions
  fetchImageLocations: (imageMapId: string) => Promise<void>;
  addImageLocation: (imageMapId: string, name: string, x: number, y: number, difficulty: string) => Promise<boolean>;
  deleteImageLocation: (locationId: string) => Promise<void>;
}

export function useLocationAdmin(): UseLocationAdminReturn {
  const [locations, setLocations] = useState<Location[]>([]);
  const [imageLocations, setImageLocations] = useState<ImageLocation[]>([]);
  const [loading, setLoading] = useState(false);

  // Country Locations
  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/locations");
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast.error("Fehler beim Laden der Orte");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshLocations = useCallback(async () => {
    try {
      const res = await fetch("/api/locations");
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      }
    } catch (error) {
      console.error("Error refreshing locations:", error);
    }
  }, []);

  const fetchLocationsByCountry = useCallback(async (countryNameEn: string) => {
    try {
      const res = await fetch(`/api/locations?country=${encodeURIComponent(countryNameEn)}`);
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      }
    } catch (error) {
      console.error("Error fetching locations by country:", error);
    }
  }, []);

  const addLocation = useCallback(async (
    country: string,
    name: string,
    lat: number,
    lng: number,
    difficulty: string
  ): Promise<boolean> => {
    try {
      const response = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, latitude: lat, longitude: lng, difficulty, country }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Fehler beim Speichern");
        return false;
      }

      toast.success("Ort hinzugefügt");
      await refreshLocations();
      return true;
    } catch {
      toast.error("Fehler beim Speichern des Ortes");
      return false;
    }
  }, [refreshLocations]);

  const deleteLocation = useCallback(async (locationId: string) => {
    try {
      const response = await fetch(`/api/locations?id=${locationId}`, { method: "DELETE" });

      if (response.ok) {
        toast.success("Ort gelöscht");
        setLocations((prev) => prev.filter((l) => l.id !== locationId));
      } else {
        toast.error("Fehler beim Löschen");
      }
    } catch {
      toast.error("Fehler beim Löschen");
    }
  }, []);

  const importLocations = useCallback(async (locationsData: unknown[], country: string) => {
    const response = await fetch("/api/locations/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locations: locationsData, country }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.details?.join("\n") || result.error || "Import fehlgeschlagen");
    }

    let message = `${result.imported} Orte importiert`;
    if (result.duplicatesSkipped > 0) {
      message += `, ${result.duplicatesSkipped} Duplikate übersprungen`;
    }
    toast.success(message);

    await refreshLocations();
    return { imported: result.imported, duplicatesSkipped: result.duplicatesSkipped };
  }, [refreshLocations]);

  // Translation
  const translateLocations = useCallback(async (country: string): Promise<TranslationResult> => {
    const response = await fetch("/api/locations/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country }),
    });

    const result = await response.json();

    if (!response.ok) {
      toast.error(result.error || "Übersetzung fehlgeschlagen");
      throw new Error(result.error || "Translation failed");
    }

    if (result.translated > 0) {
      toast.success(`${result.translated} Orte übersetzt`);
      await refreshLocations();
    } else if (result.message) {
      toast.success(result.message);
    }

    return result;
  }, [refreshLocations]);

  const fetchTranslationStatus = useCallback(async (country: string): Promise<TranslationStatus> => {
    const response = await fetch(`/api/locations/translate?country=${encodeURIComponent(country)}`);
    if (!response.ok) {
      throw new Error("Failed to fetch translation status");
    }
    return response.json();
  }, []);

  // Image Locations
  const fetchImageLocations = useCallback(async (imageMapId: string) => {
    try {
      const res = await fetch(`/api/image-locations?imageMapId=${imageMapId}`);
      if (res.ok) {
        const data = await res.json();
        setImageLocations(data.locations);
      }
    } catch (error) {
      console.error("Error fetching image locations:", error);
    }
  }, []);

  const addImageLocation = useCallback(async (
    imageMapId: string,
    name: string,
    x: number,
    y: number,
    difficulty: string
  ): Promise<boolean> => {
    try {
      const response = await fetch("/api/image-locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageMapId, name, x, y, difficulty }),
      });

      if (!response.ok) {
        throw new Error("Failed to create image location");
      }

      toast.success("Bild-Ort hinzugefügt");
      await fetchImageLocations(imageMapId);
      return true;
    } catch {
      toast.error("Fehler beim Speichern des Ortes");
      return false;
    }
  }, [fetchImageLocations]);

  const deleteImageLocation = useCallback(async (locationId: string) => {
    try {
      const response = await fetch(`/api/image-locations?id=${locationId}`, { method: "DELETE" });

      if (response.ok) {
        toast.success("Bild-Ort gelöscht");
        setImageLocations((prev) => prev.filter((l) => l.id !== locationId));
      } else {
        toast.error("Fehler beim Löschen");
      }
    } catch {
      toast.error("Fehler beim Löschen");
    }
  }, []);

  return {
    locations,
    imageLocations,
    loading,
    setLocations,
    setImageLocations,
    addLocation,
    deleteLocation,
    importLocations,
    refreshLocations,
    fetchLocations,
    fetchLocationsByCountry,
    translateLocations,
    fetchTranslationStatus,
    fetchImageLocations,
    addImageLocation,
    deleteImageLocation,
  };
}
