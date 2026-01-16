"use client";

import { CountriesTab, LocationsTab } from "../../components";
import { useCountryAdmin } from "../../hooks/useCountryAdmin";
import { useLocationAdmin } from "../../hooks/useLocationAdmin";
import { useState } from "react";
import { cn } from "@/lib/utils";

type SubTab = "countries" | "locations";

export default function CountriesPage() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("countries");

  const {
    countries,
    loading: countriesLoading,
    addCountry,
    deleteCountry,
    updateCountry,
  } = useCountryAdmin();

  const {
    locations,
    loading: locationsLoading,
    addLocation,
    deleteLocation,
    importLocations,
    fetchLocationsByCountry,
    translateLocations,
    fetchTranslationStatus,
  } = useLocationAdmin();

  const loading = countriesLoading || locationsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Länder</h1>
        <p className="text-text-secondary">Länder und deren Orte verwalten</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 p-1 rounded-lg bg-surface-2 border border-glass-border w-fit">
        <button
          onClick={() => setActiveSubTab("countries")}
          className={cn(
            "px-4 py-2 rounded-md font-medium transition-all duration-200",
            activeSubTab === "countries"
              ? "bg-primary text-white shadow-sm"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-3"
          )}
        >
          Länder ({countries.length})
        </button>
        <button
          onClick={() => setActiveSubTab("locations")}
          className={cn(
            "px-4 py-2 rounded-md font-medium transition-all duration-200",
            activeSubTab === "locations"
              ? "bg-primary text-white shadow-sm"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-3"
          )}
        >
          Orte
        </button>
      </div>

      {activeSubTab === "countries" && (
        <CountriesTab
          countries={countries}
          onAdd={addCountry}
          onDelete={deleteCountry}
          onUpdate={updateCountry}
        />
      )}

      {activeSubTab === "locations" && (
        <LocationsTab
          locations={locations}
          countries={countries}
          onDelete={deleteLocation}
          onAdd={addLocation}
          onImport={importLocations}
          onFetchByCountry={fetchLocationsByCountry}
          onTranslate={translateLocations}
          onFetchTranslationStatus={fetchTranslationStatus}
        />
      )}
    </div>
  );
}
