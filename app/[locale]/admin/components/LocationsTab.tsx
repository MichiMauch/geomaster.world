"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import ConfirmModal from "@/components/ConfirmModal";
import { SingleLocationForm } from "./locations/SingleLocationForm";
import { LocationImportForm } from "./locations/LocationImportForm";
import { LocationList } from "./locations/LocationList";
import { ImportModal } from "./locations/ImportModal";
import type { Location, Country, TranslationStatus, TranslationResult } from "../types";

interface LocationsTabProps {
  locations: Location[];
  countries: Country[];
  onDelete: (locationId: string) => Promise<void>;
  onAdd: (country: string, name: string, lat: number, lng: number, difficulty: string) => Promise<boolean>;
  onImport: (locations: unknown[], country: string) => Promise<{ imported: number; duplicatesSkipped: number }>;
  onFetchByCountry: (countryNameEn: string) => Promise<void>;
  onTranslate: (country: string) => Promise<TranslationResult>;
  onFetchTranslationStatus: (country: string) => Promise<TranslationStatus>;
}

type SubTab = "single" | "import";

export function LocationsTab({
  locations,
  countries,
  onDelete,
  onAdd,
  onImport,
  onFetchByCountry,
  onTranslate,
  onFetchTranslationStatus,
}: LocationsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("single");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translationStatus, setTranslationStatus] = useState<TranslationStatus | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    locationId: string | null;
    locationName: string;
  }>({
    isOpen: false,
    locationId: null,
    locationName: "",
  });

  const [importModal, setImportModal] = useState<{
    isOpen: boolean;
    fileData: unknown[] | null;
    fileName: string;
  }>({
    isOpen: false,
    fileData: null,
    fileName: "",
  });

  // Set default country
  useEffect(() => {
    if (countries.length > 0 && !selectedCountry) {
      setSelectedCountry(countries[0]);
    }
  }, [countries, selectedCountry]);

  // Fetch locations when country changes
  useEffect(() => {
    if (selectedCountry) {
      onFetchByCountry(selectedCountry.nameEn || selectedCountry.name);
    }
  }, [selectedCountry, onFetchByCountry]);

  // Fetch translation status when country changes
  useEffect(() => {
    if (selectedCountry) {
      onFetchTranslationStatus(selectedCountry.nameEn || selectedCountry.name)
        .then(setTranslationStatus)
        .catch(() => setTranslationStatus(null));
    }
  }, [selectedCountry, onFetchTranslationStatus]);

  const handleCountryChange = useCallback((countryId: string) => {
    const country = countries.find((c) => c.id === countryId);
    setSelectedCountry(country || null);
  }, [countries]);

  const handleTranslate = useCallback(async () => {
    if (!selectedCountry) return;

    setTranslating(true);
    try {
      await onTranslate(selectedCountry.nameEn || selectedCountry.name);
      const newStatus = await onFetchTranslationStatus(selectedCountry.nameEn || selectedCountry.name);
      setTranslationStatus(newStatus);
    } catch {
      // Error handled by toast in hook
    } finally {
      setTranslating(false);
    }
  }, [selectedCountry, onTranslate, onFetchTranslationStatus]);

  const handleFileSelect = useCallback((data: unknown[], fileName: string) => {
    setImportModal({ isOpen: true, fileData: data, fileName });
  }, []);

  const handleImportConfirm = useCallback(async () => {
    if (!importModal.fileData || !selectedCountry) return;

    setImporting(true);
    setImportError("");

    try {
      await onImport(importModal.fileData, selectedCountry.nameEn || selectedCountry.name);
      setImportModal({ isOpen: false, fileData: null, fileName: "" });
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Fehler beim Import");
    } finally {
      setImporting(false);
    }
  }, [importModal.fileData, selectedCountry, onImport]);

  const handleDeleteRequest = useCallback((locationId: string, locationName: string) => {
    setDeleteModal({ isOpen: true, locationId, locationName });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteModal.locationId) return;
    await onDelete(deleteModal.locationId);
    setDeleteModal({ isOpen: false, locationId: null, locationName: "" });
  }, [deleteModal.locationId, onDelete]);

  return (
    <>
      <div className="space-y-6">
        {/* Country selector */}
        <Card variant="surface" padding="lg">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-body-small font-medium text-text-primary mb-2">
                Land auswählen
              </label>
              <select
                value={selectedCountry?.id || ""}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-surface-2 border border-glass-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.icon} {country.name} ({country.locationCount} Orte)
                  </option>
                ))}
              </select>
            </div>

            {/* Sub-tab navigation */}
            <div className="flex gap-1 p-1 rounded-lg bg-surface-2 border border-glass-border">
              <button
                onClick={() => setActiveSubTab("single")}
                className={cn(
                  "px-4 py-2 rounded-md font-medium transition-all duration-200",
                  activeSubTab === "single"
                    ? "bg-primary text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-3"
                )}
              >
                Einzelner Ort
              </button>
              <button
                onClick={() => setActiveSubTab("import")}
                className={cn(
                  "px-4 py-2 rounded-md font-medium transition-all duration-200",
                  activeSubTab === "import"
                    ? "bg-primary text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-3"
                )}
              >
                JSON Import
              </button>
            </div>

            {/* Translation button */}
            {translationStatus && translationStatus.untranslatedCount > 0 && (
              <Button
                variant="secondary"
                size="md"
                onClick={handleTranslate}
                isLoading={translating}
                disabled={translating}
                className="whitespace-nowrap"
              >
                {translating ? "Übersetze..." : `${translationStatus.untranslatedCount} Orte übersetzen`}
              </Button>
            )}

            {translationStatus && translationStatus.untranslatedCount === 0 && translationStatus.totalCount > 0 && (
              <Badge variant="success" size="sm">
                Alle übersetzt
              </Badge>
            )}
          </div>
        </Card>

        {/* Single Location Form */}
        {activeSubTab === "single" && selectedCountry && (
          <SingleLocationForm country={selectedCountry} onAdd={onAdd} />
        )}

        {/* JSON Import Form */}
        {activeSubTab === "import" && (
          <LocationImportForm
            selectedCountry={selectedCountry}
            onFileSelect={handleFileSelect}
          />
        )}

        {/* Location list */}
        <LocationList
          locations={locations}
          selectedCountry={selectedCountry}
          onDelete={handleDeleteRequest}
        />
      </div>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Ort löschen"
        message={`Möchtest du "${deleteModal.locationName}" wirklich löschen?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, locationId: null, locationName: "" })}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={importModal.isOpen}
        fileName={importModal.fileName}
        fileData={importModal.fileData}
        selectedCountry={selectedCountry}
        importing={importing}
        importError={importError}
        onConfirm={handleImportConfirm}
        onCancel={() => {
          setImportModal({ isOpen: false, fileData: null, fileName: "" });
          setImportError("");
        }}
      />
    </>
  );
}
