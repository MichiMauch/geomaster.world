"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import ConfirmModal from "@/components/ConfirmModal";
import type { WorldLocation, WorldQuizType } from "../types";

interface WorldLocationsTabProps {
  worldQuizTypes: WorldQuizType[];
  worldLocations: WorldLocation[];
  onDelete: (locationId: string) => Promise<void>;
  onAdd: (category: string, name: string, lat: number, lng: number, countryCode: string, difficulty: string) => Promise<boolean>;
  onImport: (locations: unknown[], category: string) => Promise<{ imported: number; duplicatesSkipped: number }>;
  onFetchByCategory: (category: string) => Promise<void>;
}

const exampleJson = [
  {
    name: "Silverstone Circuit",
    latitude: 52.0786,
    longitude: -1.0169,
    countryCode: "GB",
    difficulty: "medium",
  },
  {
    name: "Circuit de Monaco",
    latitude: 43.7347,
    longitude: 7.4206,
    countryCode: "MC",
    difficulty: "easy",
  },
];

const difficultyOptions = [
  { value: "easy", label: "Einfach" },
  { value: "medium", label: "Mittel" },
  { value: "hard", label: "Schwer" },
];

type SubTab = "single" | "import";

export function WorldLocationsTab({
  worldQuizTypes,
  worldLocations,
  onDelete,
  onAdd,
  onImport,
  onFetchByCategory,
}: WorldLocationsTabProps) {
  // Sub-tab state
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("single");

  // Shared state
  const [selectedCategory, setSelectedCategory] = useState<WorldQuizType | null>(null);

  // Single location form state
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
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

  // Set default category
  useEffect(() => {
    if (worldQuizTypes.length > 0 && !selectedCategory) {
      setSelectedCategory(worldQuizTypes[0]);
    }
  }, [worldQuizTypes, selectedCategory]);

  // Fetch locations when category changes
  useEffect(() => {
    if (selectedCategory) {
      onFetchByCategory(selectedCategory.id);
    }
  }, [selectedCategory, onFetchByCategory]);

  // Single location form submit
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!selectedCategory) {
      setFormError("Bitte wähle eine Kategorie aus");
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
      selectedCategory.id,
      locationName.trim(),
      lat,
      lng,
      countryCode.trim().toUpperCase(),
      difficulty
    );

    if (success) {
      // Reset form
      setLocationName("");
      setLatitude("");
      setLongitude("");
      setCountryCode("");
      setDifficulty("medium");
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
      setImportError("");
    } catch {
      setImportError("Ungültiges JSON-Format");
    }

    // Reset file input
    e.target.value = "";
  };

  const handleImportConfirm = async () => {
    if (!importModal.fileData || !selectedCategory) return;

    setImporting(true);
    try {
      await onImport(importModal.fileData, selectedCategory.id);
      setImportModal({ isOpen: false, fileData: null, fileName: "" });
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Import fehlgeschlagen");
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.locationId) return;
    await onDelete(deleteModal.locationId);
    setDeleteModal({ isOpen: false, locationId: null, locationName: "" });
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case "easy":
        return <Badge variant="success">Einfach</Badge>;
      case "hard":
        return <Badge variant="error">Schwer</Badge>;
      default:
        return <Badge variant="warning">Mittel</Badge>;
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-h2 text-text-primary">Welt-Orte verwalten</h2>
        </div>

        {/* Category Selector */}
        <Card variant="surface" padding="md">
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-body-small font-medium text-text-secondary">Kategorie:</label>
            <div className="flex flex-wrap gap-2">
              {worldQuizTypes.map((quizType) => (
                <button
                  key={quizType.id}
                  onClick={() => setSelectedCategory(quizType)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                    selectedCategory?.id === quizType.id
                      ? "bg-primary text-white"
                      : "bg-surface-2 text-text-secondary hover:bg-surface-3"
                  )}
                >
                  <span>{quizType.icon}</span>
                  <span>{quizType.name}</span>
                  <Badge variant="default" className="ml-1">{quizType.locationCount}</Badge>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {selectedCategory && (
          <>
            {/* Sub-tabs */}
            <div className="flex gap-2 border-b border-glass-border pb-2">
              <button
                onClick={() => setActiveSubTab("single")}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors",
                  activeSubTab === "single"
                    ? "bg-surface-2 text-text-primary border-b-2 border-primary"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                Einzeln hinzufügen
              </button>
              <button
                onClick={() => setActiveSubTab("import")}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors",
                  activeSubTab === "import"
                    ? "bg-surface-2 text-text-primary border-b-2 border-primary"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                JSON Import
              </button>
            </div>

            {/* Single Add Form */}
            {activeSubTab === "single" && (
              <Card variant="surface" padding="lg">
                <h3 className="text-h3 text-text-primary mb-4">
                  Ort zu &quot;{selectedCategory.name}&quot; hinzufügen
                </h3>
                <form onSubmit={handleSingleSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Ortsname"
                      type="text"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="z.B. Silverstone Circuit"
                      required
                    />
                    <Input
                      label="Ländercode (ISO, optional)"
                      type="text"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      placeholder="z.B. GB, US, DE"
                      maxLength={3}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <Input
                      label="Breitengrad (Latitude)"
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="z.B. 52.0786"
                      required
                    />
                    <Input
                      label="Längengrad (Longitude)"
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="z.B. -1.0169"
                      required
                    />
                    <div>
                      <label className="block text-body-small font-medium text-text-primary mb-2">
                        Schwierigkeit
                      </label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-surface-2 border border-glass-border text-text-primary"
                      >
                        {difficultyOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {formError && <p className="text-error text-body-small">{formError}</p>}

                  <Button type="submit" variant="primary" isLoading={saving}>
                    Ort hinzufügen
                  </Button>
                </form>
              </Card>
            )}

            {/* JSON Import */}
            {activeSubTab === "import" && (
              <Card variant="surface" padding="lg">
                <h3 className="text-h3 text-text-primary mb-4">
                  Orte zu &quot;{selectedCategory.name}&quot; importieren
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-body-small font-medium text-text-primary mb-2">
                      JSON-Datei hochladen
                    </label>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-text-secondary
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-medium
                        file:bg-primary file:text-white
                        hover:file:bg-primary/90
                        file:cursor-pointer"
                    />
                  </div>

                  {importError && <p className="text-error text-body-small">{importError}</p>}

                  <div className="bg-surface-2 rounded-lg p-4">
                    <p className="text-body-small text-text-secondary mb-2">Beispiel JSON-Format:</p>
                    <pre className="text-caption text-text-muted overflow-x-auto">
                      {JSON.stringify(exampleJson, null, 2)}
                    </pre>
                  </div>
                </div>
              </Card>
            )}

            {/* Locations List */}
            <Card variant="surface" padding="none" className="overflow-hidden">
              <div className="px-6 py-4 border-b border-glass-border flex items-center justify-between">
                <h3 className="text-h3 text-text-primary">
                  Orte in &quot;{selectedCategory.name}&quot; ({worldLocations.length})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-2 border-b border-glass-border">
                    <tr>
                      <th className="text-left px-6 py-3 text-caption font-medium text-text-secondary">Name</th>
                      <th className="text-center px-6 py-3 text-caption font-medium text-text-secondary">Land</th>
                      <th className="text-center px-6 py-3 text-caption font-medium text-text-secondary">Koordinaten</th>
                      <th className="text-center px-6 py-3 text-caption font-medium text-text-secondary">Schwierigkeit</th>
                      <th className="text-right px-6 py-3 text-caption font-medium text-text-secondary">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border">
                    {worldLocations.map((location) => (
                      <tr key={location.id} className="hover:bg-surface-2/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-text-primary">{location.name}</p>
                          {location.nameEn && location.nameEn !== location.name && (
                            <p className="text-caption text-text-muted">{location.nameEn}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-text-secondary">{location.countryCode || "—"}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-caption text-text-muted font-mono">
                            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {getDifficultyBadge(location.difficulty)}
                        </td>
                        <td className="px-6 py-4 text-right">
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
                        </td>
                      </tr>
                    ))}
                    {worldLocations.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                          Keine Orte in dieser Kategorie
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {worldQuizTypes.length === 0 && (
          <Card variant="surface" padding="lg">
            <p className="text-text-muted text-center">
              Bitte erstelle zuerst eine Welt-Quiz-Kategorie im Tab &quot;Welt-Quiz&quot;.
            </p>
          </Card>
        )}
      </div>

      {/* Import Confirmation Modal */}
      {importModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <Card variant="elevated" padding="lg" className="w-full max-w-md mx-4">
            <h2 className="text-h3 text-text-primary mb-4">Import bestätigen</h2>
            <p className="text-text-secondary mb-4">
              Möchtest du <strong>{importModal.fileData?.length}</strong> Orte aus{" "}
              <strong>{importModal.fileName}</strong> in die Kategorie{" "}
              <strong>{selectedCategory?.name}</strong> importieren?
            </p>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setImportModal({ isOpen: false, fileData: null, fileName: "" })}
                disabled={importing}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                variant="primary"
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

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Ort löschen"
        message={`Möchtest du "${deleteModal.locationName}" wirklich löschen?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, locationId: null, locationName: "" })}
      />
    </>
  );
}
