"use client";

import { WorldQuizTypesTab, WorldLocationsTab } from "../../components";
import { useWorldQuizAdmin } from "../../hooks/useWorldQuizAdmin";
import { useState } from "react";
import { cn } from "@/lib/utils";

type SubTab = "quiz-types" | "locations";

export default function WorldPage() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("quiz-types");
  const {
    worldQuizTypes,
    worldLocations,
    loading,
    addWorldQuizType,
    deleteWorldQuizType,
    updateWorldQuizType,
    addWorldLocation,
    deleteWorldLocation,
    importWorldLocations,
    fetchWorldLocationsByCategory,
    translateWorldLocations,
    fetchWorldLocationTranslationStatus,
  } = useWorldQuizAdmin();

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
        <h1 className="text-2xl font-bold text-text-primary">Welt-Quizze</h1>
        <p className="text-text-secondary">Welt-Quiz-Typen und globale Orte verwalten</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 p-1 rounded-lg bg-surface-2 border border-glass-border w-fit">
        <button
          onClick={() => setActiveSubTab("quiz-types")}
          className={cn(
            "px-4 py-2 rounded-md font-medium transition-all duration-200",
            activeSubTab === "quiz-types"
              ? "bg-primary text-white shadow-sm"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-3"
          )}
        >
          Quiz-Typen ({worldQuizTypes.length})
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
          Welt-Orte ({worldLocations.length})
        </button>
      </div>

      {activeSubTab === "quiz-types" && (
        <WorldQuizTypesTab
          worldQuizTypes={worldQuizTypes}
          onAdd={addWorldQuizType}
          onDelete={deleteWorldQuizType}
          onUpdate={updateWorldQuizType}
        />
      )}

      {activeSubTab === "locations" && (
        <WorldLocationsTab
          worldLocations={worldLocations}
          worldQuizTypes={worldQuizTypes}
          onDelete={deleteWorldLocation}
          onAdd={addWorldLocation}
          onImport={importWorldLocations}
          onFetchByCategory={fetchWorldLocationsByCategory}
          onTranslate={translateWorldLocations}
          onFetchTranslationStatus={fetchWorldLocationTranslationStatus}
        />
      )}
    </div>
  );
}
