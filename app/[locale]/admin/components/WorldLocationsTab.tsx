"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import ConfirmModal from "@/components/ConfirmModal";
import { CategorySelector } from "./world-locations/CategorySelector";
import { WorldLocationForm } from "./world-locations/WorldLocationForm";
import { WorldLocationImportForm } from "./world-locations/WorldLocationImportForm";
import { WorldLocationTable } from "./world-locations/WorldLocationTable";
import { WorldLocationImportModal } from "./world-locations/WorldLocationImportModal";
import type { WorldLocation, WorldQuizType, TranslationStatus, TranslationResult } from "../types";

interface WorldLocationsTabProps {
  worldQuizTypes: WorldQuizType[];
  worldLocations: WorldLocation[];
  onDelete: (locationId: string) => Promise<void>;
  onAdd: (category: string, name: string, lat: number, lng: number, countryCode: string, difficulty: string) => Promise<boolean>;
  onImport: (locations: unknown[], category: string) => Promise<{ imported: number; duplicatesSkipped: number }>;
  onFetchByCategory: (category: string) => Promise<void>;
  onTranslate: (category: string) => Promise<TranslationResult>;
  onFetchTranslationStatus: (category: string) => Promise<TranslationStatus>;
}

type SubTab = "single" | "import";

export function WorldLocationsTab({
  worldQuizTypes,
  worldLocations,
  onDelete,
  onAdd,
  onImport,
  onFetchByCategory,
  onTranslate,
  onFetchTranslationStatus,
}: WorldLocationsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("single");
  const [selectedCategory, setSelectedCategory] = useState<WorldQuizType | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translationStatus, setTranslationStatus] = useState<TranslationStatus | null>(null);
  const [importing, setImporting] = useState(false);

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

  // Fetch locations and translation status when category changes
  useEffect(() => {
    if (selectedCategory) {
      onFetchByCategory(selectedCategory.id);
      onFetchTranslationStatus(selectedCategory.id)
        .then(setTranslationStatus)
        .catch(() => setTranslationStatus(null));
    }
  }, [selectedCategory, onFetchByCategory, onFetchTranslationStatus]);

  const handleCategorySelect = useCallback((category: WorldQuizType) => {
    setSelectedCategory(category);
  }, []);

  const handleFileSelect = useCallback((data: unknown[], fileName: string) => {
    setImportModal({ isOpen: true, fileData: data, fileName });
  }, []);

  const handleImportConfirm = useCallback(async () => {
    if (!importModal.fileData || !selectedCategory) return;

    setImporting(true);
    try {
      await onImport(importModal.fileData, selectedCategory.id);
      setImportModal({ isOpen: false, fileData: null, fileName: "" });
    } catch {
      // Error handled by hook
    } finally {
      setImporting(false);
    }
  }, [importModal.fileData, selectedCategory, onImport]);

  const handleDeleteRequest = useCallback((locationId: string, locationName: string) => {
    setDeleteModal({ isOpen: true, locationId, locationName });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteModal.locationId) return;
    await onDelete(deleteModal.locationId);
    setDeleteModal({ isOpen: false, locationId: null, locationName: "" });
  }, [deleteModal.locationId, onDelete]);

  const handleTranslate = useCallback(async () => {
    if (!selectedCategory) return;
    setTranslating(true);
    try {
      await onTranslate(selectedCategory.id);
      const status = await onFetchTranslationStatus(selectedCategory.id);
      setTranslationStatus(status);
    } catch {
      // Error handled by hook
    } finally {
      setTranslating(false);
    }
  }, [selectedCategory, onTranslate, onFetchTranslationStatus]);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-h2 text-text-primary">Welt-Orte verwalten</h2>
        </div>

        {/* Category Selector */}
        <CategorySelector
          categories={worldQuizTypes}
          selectedCategory={selectedCategory}
          onSelect={handleCategorySelect}
        />

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
              <WorldLocationForm selectedCategory={selectedCategory} onAdd={onAdd} />
            )}

            {/* JSON Import */}
            {activeSubTab === "import" && (
              <WorldLocationImportForm
                selectedCategory={selectedCategory}
                onFileSelect={handleFileSelect}
              />
            )}

            {/* Locations Table */}
            <WorldLocationTable
              worldLocations={worldLocations}
              selectedCategory={selectedCategory}
              translationStatus={translationStatus}
              translating={translating}
              onDelete={handleDeleteRequest}
              onTranslate={handleTranslate}
            />
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
      <WorldLocationImportModal
        isOpen={importModal.isOpen}
        fileName={importModal.fileName}
        fileData={importModal.fileData}
        selectedCategory={selectedCategory}
        importing={importing}
        onConfirm={handleImportConfirm}
        onCancel={() => setImportModal({ isOpen: false, fileData: null, fileName: "" })}
      />

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
