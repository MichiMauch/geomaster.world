import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import type { Group, User, Location, ImageLocation, Country, TranslationStatus, TranslationResult } from "../types";

interface UseAdminDataReturn {
  groups: Group[];
  users: User[];
  countries: Country[];
  locations: Location[];
  imageLocations: ImageLocation[];
  loading: boolean;
  // Group actions
  deleteGroup: (groupId: string, groupName: string) => Promise<void>;
  // User actions
  deleteUser: (userId: string, userName: string | null) => Promise<void>;
  toggleHint: (userId: string, currentState: boolean | null) => Promise<void>;
  toggleSuperAdmin: (userId: string, currentState: boolean | null) => Promise<void>;
  // Country actions
  addCountry: (country: Omit<Country, "createdAt" | "locationCount"> & { geoJsonData?: string }) => Promise<boolean>;
  deleteCountry: (countryId: string) => Promise<void>;
  updateCountry: (countryId: string, data: Partial<Country>) => Promise<boolean>;
  refreshCountries: () => Promise<void>;
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
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [imageLocations, setImageLocations] = useState<ImageLocation[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [groupsRes, usersRes, countriesRes, locationsRes] = await Promise.all([
          fetch("/api/admin/groups"),
          fetch("/api/admin/users"),
          fetch("/api/countries"),
          fetch("/api/locations"),
        ]);

        if (groupsRes.ok) {
          const data = await groupsRes.json();
          setGroups(data.groups);
        }

        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(data.users);
        }

        if (countriesRes.ok) {
          const data = await countriesRes.json();
          setCountries(data);
        }

        if (locationsRes.ok) {
          const data = await locationsRes.json();
          setLocations(data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Fehler beim Laden der Daten");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group actions
  const deleteGroup = useCallback(async (groupId: string, groupName: string) => {
    if (!confirm(`Gruppe "${groupName}" wirklich löschen? Alle Spiele, Runden und Guesses werden ebenfalls gelöscht!`)) {
      return;
    }

    try {
      const response = await fetch("/api/admin/groups", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });

      if (response.ok) {
        toast.success("Gruppe gelöscht");
        setGroups((prev) => prev.filter((g) => g.id !== groupId));
      } else {
        toast.error("Fehler beim Löschen");
      }
    } catch {
      toast.error("Fehler beim Löschen");
    }
  }, []);

  // User actions
  const deleteUser = useCallback(async (userId: string, userName: string | null) => {
    if (!confirm(`User "${userName || 'Unbenannt'}" wirklich löschen? Alle Guesses und Gruppenmitgliedschaften werden ebenfalls gelöscht!`)) {
      return;
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        toast.success("User gelöscht");
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        const data = await response.json();
        toast.error(data.error || "Fehler beim Löschen");
      }
    } catch {
      toast.error("Fehler beim Löschen");
    }
  }, []);

  const toggleHint = useCallback(async (userId: string, currentState: boolean | null) => {
    const newState = !currentState;
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, hintEnabled: newState }),
      });

      if (response.ok) {
        toast.success(newState ? "Hilfskreis aktiviert" : "Hilfskreis deaktiviert");
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, hintEnabled: newState } : u))
        );
      } else {
        toast.error("Fehler beim Ändern");
      }
    } catch {
      toast.error("Fehler beim Ändern");
    }
  }, []);

  const toggleSuperAdmin = useCallback(async (userId: string, currentState: boolean | null) => {
    const newState = !currentState;
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isSuperAdmin: newState }),
      });

      if (response.ok) {
        toast.success(newState ? "Admin-Rechte erteilt" : "Admin-Rechte entzogen");
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isSuperAdmin: newState } : u))
        );
      } else {
        const data = await response.json();
        toast.error(data.error || "Fehler beim Ändern");
      }
    } catch {
      toast.error("Fehler beim Ändern");
    }
  }, []);

  // Country actions
  const refreshCountries = useCallback(async () => {
    try {
      const res = await fetch("/api/countries");
      if (res.ok) {
        const data = await res.json();
        setCountries(data);
      }
    } catch (error) {
      console.error("Error refreshing countries:", error);
    }
  }, []);

  const addCountry = useCallback(async (country: Omit<Country, "createdAt" | "locationCount"> & { geoJsonData?: string }): Promise<boolean> => {
    try {
      const response = await fetch("/api/countries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(country),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Fehler beim Erstellen");
        return false;
      }

      toast.success("Land hinzugefügt");
      await refreshCountries();
      return true;
    } catch {
      toast.error("Fehler beim Erstellen");
      return false;
    }
  }, [refreshCountries]);

  const deleteCountry = useCallback(async (countryId: string) => {
    try {
      const response = await fetch(`/api/countries/${countryId}`, { method: "DELETE" });

      if (response.ok) {
        toast.success("Land gelöscht");
        setCountries((prev) => prev.filter((c) => c.id !== countryId));
      } else {
        toast.error("Fehler beim Löschen");
      }
    } catch {
      toast.error("Fehler beim Löschen");
    }
  }, []);

  const updateCountry = useCallback(async (countryId: string, data: Partial<Country>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/countries/${countryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        toast.error("Fehler beim Aktualisieren");
        return false;
      }

      toast.success("Land aktualisiert");
      await refreshCountries();
      return true;
    } catch {
      toast.error("Fehler beim Aktualisieren");
      return false;
    }
  }, [refreshCountries]);

  // Location actions
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

  const addLocation = useCallback(async (country: string, name: string, lat: number, lng: number, difficulty: string): Promise<boolean> => {
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

  // Image location actions
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

  // Translation actions
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

  return {
    groups,
    users,
    countries,
    locations,
    imageLocations,
    loading,
    deleteGroup,
    deleteUser,
    toggleHint,
    toggleSuperAdmin,
    addCountry,
    deleteCountry,
    updateCountry,
    refreshCountries,
    addLocation,
    deleteLocation,
    importLocations,
    refreshLocations,
    fetchLocationsByCountry,
    fetchImageLocations,
    addImageLocation,
    deleteImageLocation,
    translateLocations,
    fetchTranslationStatus,
  };
}
