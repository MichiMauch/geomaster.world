import { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import type { Country } from "../types";

interface UseCountryAdminReturn {
  countries: Country[];
  loading: boolean;
  setCountries: React.Dispatch<React.SetStateAction<Country[]>>;
  addCountry: (country: Omit<Country, "createdAt" | "locationCount"> & { geoJsonData?: string }) => Promise<boolean>;
  deleteCountry: (countryId: string) => Promise<void>;
  updateCountry: (countryId: string, data: Partial<Country>) => Promise<boolean>;
  refreshCountries: () => Promise<void>;
  fetchCountries: () => Promise<void>;
}

export function useCountryAdmin(): UseCountryAdminReturn {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCountries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/countries");
      if (res.ok) {
        const data = await res.json();
        setCountries(data);
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
      toast.error("Fehler beim Laden der Länder");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch countries on mount
  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

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

  const addCountry = useCallback(async (
    country: Omit<Country, "createdAt" | "locationCount"> & { geoJsonData?: string }
  ): Promise<boolean> => {
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

  return {
    countries,
    loading,
    setCountries,
    addCountry,
    deleteCountry,
    updateCountry,
    refreshCountries,
    fetchCountries,
  };
}
