"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import ConfirmModal from "@/components/ConfirmModal";
import type { Location, Country, TranslationStatus, TranslationResult } from "../types";

// Dynamic import for CountryMap to avoid SSR issues with Leaflet
const CountryMap = dynamic(() => import("@/components/Map/CountryMap"), { ssr: false });

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

const exampleJson = [
  {
    name: "Matterhorn",
    latitude: 45.9763,
    longitude: 7.6586,
    difficulty: "hard",
  },
  {
    name: "Zürich HB",
    latitude: 47.3783,
    longitude: 8.5403,
    difficulty: "easy",
  },
];

const difficultyOptions = [
  { value: "easy", label: "Einfach" },
  { value: "medium", label: "Mittel" },
  { value: "hard", label: "Schwer" },
];

type SubTab = "single" | "import";

export function LocationsTab({ locations, countries, onDelete, onAdd, onImport, onFetchByCountry, onTranslate, onFetchTranslationStatus }: LocationsTabProps) {
  // Sub-tab state
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("single");

  // Shared state
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  // Translation state
  const [translating, setTranslating] = useState(false);
  const [translationStatus, setTranslationStatus] = useState<TranslationStatus | null>(null);

  // Single location form state
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Import state
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

  // Sync map click to input fields
  const handleMapClick = (position: { lat: number; lng: number }) => {
    setMarkerPosition(position);
    setLatitude(position.lat.toFixed(6));
    setLongitude(position.lng.toFixed(6));
  };

  // Sync input fields to marker position
  const handleCoordinateChange = (lat: string, lng: string) => {
    setLatitude(lat);
    setLongitude(lng);

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (!isNaN(parsedLat) && !isNaN(parsedLng) &&
        parsedLat >= -90 && parsedLat <= 90 &&
        parsedLng >= -180 && parsedLng <= 180) {
      setMarkerPosition({ lat: parsedLat, lng: parsedLng });
    }
  };

  // Single location form submit
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!selectedCountry) {
      setFormError("Bitte wähle ein Land aus");
      return;
    }

    if (!locationName.trim()) {
      setFormError("Bitte gib einen Ortsnamen ein");
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setFormError("Ungültiger Breitengrad (muss zwischen -90 und 90 liegen)");
      return;
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      setFormError("Ungültiger Längengrad (muss zwischen -180 und 180 liegen)");
      return;
    }

    setSaving(true);
    const success = await onAdd(
      selectedCountry.nameEn || selectedCountry.name,
      locationName.trim(),
      lat,
      lng,
      difficulty
    );

    if (success) {
      // Reset form
      setLocationName("");
      setLatitude("");
      setLongitude("");
      setDifficulty("medium");
      setMarkerPosition(null);
    }

    setSaving(false);
  };

  // Import handlers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        setImportError("Die Datei muss ein JSON-Array enthalten");
        return;
      }

      setImportModal({
        isOpen: true,
        fileData: data,
        fileName: file.name,
      });
    } catch {
      setImportError("Fehler beim Lesen der Datei");
    } finally {
      e.target.value = "";
    }
  };

  const handleImportConfirm = async () => {
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
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.locationId) return;
    await onDelete(deleteModal.locationId);
    setDeleteModal({ isOpen: false, locationId: null, locationName: "" });
  };

  const downloadExampleJson = () => {
    const blob = new Blob([JSON.stringify(exampleJson, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "locations-example.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Translate handler
  const handleTranslate = async () => {
    if (!selectedCountry) return;

    setTranslating(true);
    try {
      await onTranslate(selectedCountry.nameEn || selectedCountry.name);
      // Refresh translation status after translation
      const newStatus = await onFetchTranslationStatus(selectedCountry.nameEn || selectedCountry.name);
      setTranslationStatus(newStatus);
    } catch {
      // Error already handled by toast in hook
    } finally {
      setTranslating(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Country selector - shared between tabs */}
        <Card variant="surface" padding="lg">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-body-small font-medium text-text-primary mb-2">
                Land auswählen
              </label>
              <select
                value={selectedCountry?.id || ""}
                onChange={(e) => {
                  const country = countries.find((c) => c.id === e.target.value);
                  setSelectedCountry(country || null);
                  // Reset marker when country changes
                  setMarkerPosition(null);
                  setLatitude("");
                  setLongitude("");
                }}
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
          <Card variant="surface" padding="lg">
            <h2 className="text-h3 text-text-primary mb-6">Einzelnen Ort hinzufügen</h2>
            <form onSubmit={handleSingleSubmit} className="space-y-6">
              {/* Map preview */}
              <div>
                <label className="block text-body-small font-medium text-text-primary mb-2">
                  Position auf der Karte setzen
                </label>
                <div className="rounded-lg overflow-hidden border border-glass-border">
                  <CountryMap
                    dynamicCountry={{
                      id: selectedCountry.id,
                      centerLat: selectedCountry.centerLat,
                      centerLng: selectedCountry.centerLng,
                      boundsNorth: selectedCountry.boundsNorth,
                      boundsSouth: selectedCountry.boundsSouth,
                      boundsEast: selectedCountry.boundsEast,
                      boundsWest: selectedCountry.boundsWest,
                      defaultZoom: selectedCountry.defaultZoom,
                      minZoom: selectedCountry.minZoom,
                    }}
                    onMarkerPlace={handleMapClick}
                    markerPosition={markerPosition}
                    height="300px"
                  />
                </div>
                <p className="text-caption text-text-muted mt-2">
                  Klicke auf die Karte um die Position zu setzen, oder gib die Koordinaten manuell ein.
                </p>
              </div>

              {/* Coordinates */}
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Breitengrad (Latitude)"
                  type="number"
                  step="0.000001"
                  value={latitude}
                  onChange={(e) => handleCoordinateChange(e.target.value, longitude)}
                  placeholder="z.B. 47.3769"
                />
                <Input
                  label="Längengrad (Longitude)"
                  type="number"
                  step="0.000001"
                  value={longitude}
                  onChange={(e) => handleCoordinateChange(latitude, e.target.value)}
                  placeholder="z.B. 8.5417"
                />
              </div>

              {/* Location name */}
              <Input
                label="Ortsname"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="z.B. Zürich Hauptbahnhof"
                required
              />

              {/* Difficulty */}
              <div className="space-y-2">
                <label className="block text-body-small font-medium text-text-primary">
                  Schwierigkeit
                </label>
                <div className="flex gap-2">
                  {difficultyOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDifficulty(option.value)}
                      className={cn(
                        "flex-1 py-3 rounded-lg border-2 font-medium transition-all",
                        difficulty === option.value
                          ? option.value === "easy"
                            ? "border-success bg-success/10 text-success"
                            : option.value === "medium"
                            ? "border-warning bg-warning/10 text-warning"
                            : "border-error bg-error/10 text-error"
                          : "border-glass-border bg-surface-2 text-text-secondary hover:border-primary/50"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {formError && <p className="text-error text-body-small">{formError}</p>}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={!locationName || !latitude || !longitude}
                isLoading={saving}
              >
                Ort hinzufügen
              </Button>
            </form>
          </Card>
        )}

        {/* JSON Import Form */}
        {activeSubTab === "import" && (
          <Card variant="surface" padding="lg">
            <h2 className="text-h3 text-text-primary mb-6">Orte via JSON importieren</h2>

            <div className="flex flex-wrap gap-4 mb-6">
              <label className="relative inline-block cursor-pointer">
                <span
                  className={cn(
                    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg",
                    "font-semibold transition-all duration-200 ease-out h-12 px-4 text-sm",
                    "bg-primary text-white",
                    "hover:bg-primary/90"
                  )}
                >
                  JSON-Datei auswählen
                </span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={!selectedCountry}
                />
              </label>

              <Button variant="secondary" size="lg" onClick={downloadExampleJson}>
                Beispiel-JSON
              </Button>
            </div>

            {importError && (
              <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg">
                <p className="text-error text-body-small whitespace-pre-line">{importError}</p>
              </div>
            )}

            <div className="p-4 bg-surface-2 rounded-lg">
              <h3 className="font-medium text-text-primary mb-2">JSON-Format:</h3>
              <pre className="text-caption text-text-muted overflow-x-auto">
{`[
  {
    "name": "Ortsname",
    "latitude": 47.3769,
    "longitude": 8.5417,
    "difficulty": "easy" | "medium" | "hard"
  }
]`}
              </pre>
            </div>
          </Card>
        )}

        {/* Location list */}
        <Card variant="surface" padding="lg">
          <h2 className="text-h3 text-text-primary mb-4">
            Vorhandene Orte ({locations.length})
          </h2>

          {locations.length === 0 ? (
            <p className="text-text-muted text-center py-8">
              {selectedCountry
                ? `Noch keine Orte für ${selectedCountry.name} vorhanden.`
                : "Wähle ein Land aus."}
            </p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium text-text-primary">{location.name}</p>
                      <p className="text-caption text-text-muted">
                        {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        location.difficulty === "easy"
                          ? "success"
                          : location.difficulty === "medium"
                          ? "warning"
                          : "error"
                      }
                      size="sm"
                    >
                      {location.difficulty === "easy"
                        ? "Einfach"
                        : location.difficulty === "medium"
                        ? "Mittel"
                        : "Schwer"}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setDeleteModal({
                        isOpen: true,
                        locationId: location.id,
                        locationName: location.name,
                      })
                    }
                    className="text-error hover:text-error hover:bg-error/10"
                  >
                    Löschen
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
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
      {importModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <Card variant="elevated" padding="lg" className="w-full max-w-md mx-4">
            <h2 className="text-h3 text-text-primary mb-4">Orte importieren</h2>
            <p className="text-body-small text-text-secondary mb-2">
              Datei: <span className="font-mono text-primary">{importModal.fileName}</span>
            </p>
            <p className="text-body-small text-text-secondary mb-2">
              {importModal.fileData?.length} Orte gefunden
            </p>
            <p className="text-body-small text-text-secondary mb-4">
              Land: <span className="font-medium">{selectedCountry?.icon} {selectedCountry?.name}</span>
            </p>

            {importError && (
              <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg">
                <p className="text-error text-body-small whitespace-pre-line">{importError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setImportModal({ isOpen: false, fileData: null, fileName: "" });
                  setImportError("");
                }}
                disabled={importing}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleImportConfirm}
                isLoading={importing}
                className="flex-1"
              >
                Importieren
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
