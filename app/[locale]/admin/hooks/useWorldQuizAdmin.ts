import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import type { WorldQuizType, WorldLocation, TranslationStatus, TranslationResult } from "../types";

interface UseWorldQuizAdminReturn {
  worldQuizTypes: WorldQuizType[];
  worldLocations: WorldLocation[];
  loading: boolean;
  setWorldQuizTypes: React.Dispatch<React.SetStateAction<WorldQuizType[]>>;
  setWorldLocations: React.Dispatch<React.SetStateAction<WorldLocation[]>>;
  // World Quiz Type actions
  addWorldQuizType: (quizType: Omit<WorldQuizType, "createdAt" | "locationCount">) => Promise<boolean>;
  deleteWorldQuizType: (quizTypeId: string) => Promise<void>;
  updateWorldQuizType: (quizTypeId: string, data: Partial<WorldQuizType>) => Promise<boolean>;
  refreshWorldQuizTypes: () => Promise<void>;
  fetchWorldQuizTypes: () => Promise<void>;
  // World Location actions
  addWorldLocation: (category: string, name: string, lat: number, lng: number, countryCode: string, difficulty: string) => Promise<boolean>;
  deleteWorldLocation: (locationId: string) => Promise<void>;
  importWorldLocations: (locations: unknown[], category: string) => Promise<{ imported: number; duplicatesSkipped: number }>;
  fetchWorldLocationsByCategory: (category: string) => Promise<void>;
  // World location translation actions
  translateWorldLocations: (category: string) => Promise<TranslationResult>;
  fetchWorldLocationTranslationStatus: (category: string) => Promise<TranslationStatus>;
}

export function useWorldQuizAdmin(): UseWorldQuizAdminReturn {
  const [worldQuizTypes, setWorldQuizTypes] = useState<WorldQuizType[]>([]);
  const [worldLocations, setWorldLocations] = useState<WorldLocation[]>([]);
  const [loading, setLoading] = useState(false);

  // World Quiz Types
  const fetchWorldQuizTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/world-quiz-types");
      if (res.ok) {
        const data = await res.json();
        setWorldQuizTypes(data);
      }
    } catch (error) {
      console.error("Error fetching world quiz types:", error);
      toast.error("Fehler beim Laden der Welt-Quiz-Typen");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshWorldQuizTypes = useCallback(async () => {
    try {
      const res = await fetch("/api/world-quiz-types");
      if (res.ok) {
        const data = await res.json();
        setWorldQuizTypes(data);
      }
    } catch (error) {
      console.error("Error refreshing world quiz types:", error);
    }
  }, []);

  const addWorldQuizType = useCallback(async (
    quizType: Omit<WorldQuizType, "createdAt" | "locationCount">
  ): Promise<boolean> => {
    try {
      const response = await fetch("/api/world-quiz-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quizType),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Fehler beim Erstellen");
        return false;
      }

      toast.success("Welt-Quiz-Typ hinzugefügt");
      await refreshWorldQuizTypes();
      return true;
    } catch {
      toast.error("Fehler beim Erstellen");
      return false;
    }
  }, [refreshWorldQuizTypes]);

  const deleteWorldQuizType = useCallback(async (quizTypeId: string) => {
    try {
      const response = await fetch(`/api/world-quiz-types/${quizTypeId}`, { method: "DELETE" });

      if (response.ok) {
        toast.success("Welt-Quiz-Typ gelöscht");
        setWorldQuizTypes((prev) => prev.filter((t) => t.id !== quizTypeId));
      } else {
        toast.error("Fehler beim Löschen");
      }
    } catch {
      toast.error("Fehler beim Löschen");
    }
  }, []);

  const updateWorldQuizType = useCallback(async (
    quizTypeId: string,
    data: Partial<WorldQuizType>
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/world-quiz-types/${quizTypeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        toast.error("Fehler beim Aktualisieren");
        return false;
      }

      toast.success("Welt-Quiz-Typ aktualisiert");
      await refreshWorldQuizTypes();
      return true;
    } catch {
      toast.error("Fehler beim Aktualisieren");
      return false;
    }
  }, [refreshWorldQuizTypes]);

  // World Locations
  const fetchWorldLocationsByCategory = useCallback(async (category: string) => {
    try {
      const res = await fetch(`/api/world-locations?category=${encodeURIComponent(category)}`);
      if (res.ok) {
        const data = await res.json();
        setWorldLocations(data);
      }
    } catch (error) {
      console.error("Error fetching world locations by category:", error);
    }
  }, []);

  const addWorldLocation = useCallback(async (
    category: string,
    name: string,
    lat: number,
    lng: number,
    countryCode: string,
    difficulty: string
  ): Promise<boolean> => {
    try {
      const response = await fetch("/api/world-locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, name, latitude: lat, longitude: lng, countryCode, difficulty }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Fehler beim Speichern");
        return false;
      }

      toast.success("Welt-Ort hinzugefügt");
      await fetchWorldLocationsByCategory(category);
      return true;
    } catch {
      toast.error("Fehler beim Speichern des Ortes");
      return false;
    }
  }, [fetchWorldLocationsByCategory]);

  const deleteWorldLocation = useCallback(async (locationId: string) => {
    try {
      const response = await fetch(`/api/world-locations?id=${locationId}`, { method: "DELETE" });

      if (response.ok) {
        toast.success("Welt-Ort gelöscht");
        setWorldLocations((prev) => prev.filter((l) => l.id !== locationId));
      } else {
        toast.error("Fehler beim Löschen");
      }
    } catch {
      toast.error("Fehler beim Löschen");
    }
  }, []);

  const importWorldLocations = useCallback(async (locationsData: unknown[], category: string) => {
    const response = await fetch("/api/world-locations/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locations: locationsData, category }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.details?.join("\n") || result.error || "Import fehlgeschlagen");
    }

    let message = `${result.imported} Welt-Orte importiert`;
    if (result.duplicatesSkipped > 0) {
      message += `, ${result.duplicatesSkipped} Duplikate übersprungen`;
    }
    toast.success(message);

    await fetchWorldLocationsByCategory(category);
    return { imported: result.imported, duplicatesSkipped: result.duplicatesSkipped };
  }, [fetchWorldLocationsByCategory]);

  // Translation
  const translateWorldLocations = useCallback(async (category: string): Promise<TranslationResult> => {
    const response = await fetch("/api/world-locations/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category }),
    });

    const result = await response.json();

    if (!response.ok) {
      toast.error(result.error || "Übersetzung fehlgeschlagen");
      throw new Error(result.error || "Translation failed");
    }

    if (result.translated > 0) {
      toast.success(`${result.translated} Welt-Orte übersetzt`);
      await fetchWorldLocationsByCategory(category);
    } else if (result.message) {
      toast.success(result.message);
    }

    return result;
  }, [fetchWorldLocationsByCategory]);

  const fetchWorldLocationTranslationStatus = useCallback(async (category: string): Promise<TranslationStatus> => {
    const response = await fetch(`/api/world-locations/translate?category=${encodeURIComponent(category)}`);
    if (!response.ok) {
      throw new Error("Failed to fetch translation status");
    }
    return response.json();
  }, []);

  return {
    worldQuizTypes,
    worldLocations,
    loading,
    setWorldQuizTypes,
    setWorldLocations,
    addWorldQuizType,
    deleteWorldQuizType,
    updateWorldQuizType,
    refreshWorldQuizTypes,
    fetchWorldQuizTypes,
    addWorldLocation,
    deleteWorldLocation,
    importWorldLocations,
    fetchWorldLocationsByCategory,
    translateWorldLocations,
    fetchWorldLocationTranslationStatus,
  };
}
