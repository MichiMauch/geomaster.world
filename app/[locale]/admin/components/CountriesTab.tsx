"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import ConfirmModal from "@/components/ConfirmModal";
import type { Country } from "../types";

// Available flag emojis for selection
const FLAG_OPTIONS = [
  { emoji: "🇨🇭", label: "Schweiz" },
  { emoji: "🇩🇪", label: "Deutschland" },
  { emoji: "🇦🇹", label: "Österreich" },
  { emoji: "🇫🇷", label: "Frankreich" },
  { emoji: "🇮🇹", label: "Italien" },
  { emoji: "🇪🇸", label: "Spanien" },
  { emoji: "🇬🇧", label: "UK" },
  { emoji: "🇳🇱", label: "Niederlande" },
  { emoji: "🇧🇪", label: "Belgien" },
  { emoji: "🇵🇱", label: "Polen" },
  { emoji: "🇨🇿", label: "Tschechien" },
  { emoji: "🇸🇮", label: "Slowenien" },
  { emoji: "🇭🇺", label: "Ungarn" },
  { emoji: "🇸🇰", label: "Slowakei" },
  { emoji: "🇭🇷", label: "Kroatien" },
  { emoji: "🇷🇴", label: "Rumänien" },
  { emoji: "🇧🇬", label: "Bulgarien" },
  { emoji: "🇬🇷", label: "Griechenland" },
  { emoji: "🇵🇹", label: "Portugal" },
  { emoji: "🇸🇪", label: "Schweden" },
  { emoji: "🇳🇴", label: "Norwegen" },
  { emoji: "🇩🇰", label: "Dänemark" },
  { emoji: "🇫🇮", label: "Finnland" },
  { emoji: "🇮🇪", label: "Irland" },
  { emoji: "🇱🇺", label: "Luxemburg" },
  { emoji: "🇱🇮", label: "Liechtenstein" },
  { emoji: "🇲🇨", label: "Monaco" },
  { emoji: "🇺🇸", label: "USA" },
  { emoji: "🇨🇦", label: "Kanada" },
  { emoji: "🇯🇵", label: "Japan" },
  { emoji: "🇦🇺", label: "Australien" },
  { emoji: "🇧🇷", label: "Brasilien" },
  { emoji: "🌍", label: "Welt" },
  { emoji: "🏴", label: "Andere" },
];

// Flag picker component
function FlagPicker({
  value,
  onChange,
  label = "Flagge"
}: {
  value: string;
  onChange: (emoji: string) => void;
  label?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <label className="block text-body-small font-medium text-text-primary mb-2">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-lg bg-surface-2 border border-glass-border text-left flex items-center justify-between hover:bg-surface-3 transition-colors"
      >
        <span className="text-2xl">{value || "🏴"}</span>
        <span className="text-text-muted text-sm">
          {FLAG_OPTIONS.find(f => f.emoji === value)?.label || "Auswählen"}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-surface-2 border border-glass-border rounded-lg shadow-lg p-3 max-h-64 overflow-y-auto">
          <div className="grid grid-cols-6 gap-2">
            {FLAG_OPTIONS.map((flag) => (
              <button
                key={flag.emoji}
                type="button"
                onClick={() => {
                  onChange(flag.emoji);
                  setIsOpen(false);
                }}
                className={`p-2 text-2xl rounded-lg transition-colors hover:bg-surface-3 ${
                  value === flag.emoji ? "bg-primary/20 ring-2 ring-primary" : ""
                }`}
                title={flag.label}
              >
                {flag.emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface CountriesTabProps {
  countries: Country[];
  onAdd: (country: Omit<Country, "createdAt" | "locationCount"> & { geoJsonData?: string }) => Promise<boolean>;
  onDelete: (countryId: string) => Promise<void>;
  onUpdate: (countryId: string, data: Partial<Country> & { geoJsonData?: string }) => Promise<boolean>;
}

interface ParsedGeoJson {
  name: string;
  id: string;
  bounds: { north: number; south: number; east: number; west: number };
  center: { lat: number; lng: number };
}

// Recursively extract all coordinates from GeoJSON
function extractCoordinates(obj: unknown): [number, number][] {
  const coords: [number, number][] = [];

  if (Array.isArray(obj)) {
    // Check if it's a coordinate pair [lng, lat]
    if (obj.length >= 2 && typeof obj[0] === "number" && typeof obj[1] === "number") {
      coords.push([obj[0], obj[1]]);
    } else {
      // Recursively process array elements
      for (const item of obj) {
        coords.push(...extractCoordinates(item));
      }
    }
  } else if (obj && typeof obj === "object") {
    // Recursively process object properties
    for (const value of Object.values(obj)) {
      coords.push(...extractCoordinates(value));
    }
  }

  return coords;
}

// Parse GeoJSON and extract name, bounds, center
function parseGeoJson(geoJson: object, fileName: string): ParsedGeoJson {
  const coords = extractCoordinates(geoJson);

  if (coords.length === 0) {
    throw new Error("Keine Koordinaten im GeoJSON gefunden");
  }

  // Calculate bounds (coords are [lng, lat])
  let minLng = Infinity, maxLng = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;

  for (const [lng, lat] of coords) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  // Try to extract name from GeoJSON properties
  let name = "";
  const geoJsonTyped = geoJson as { features?: Array<{ properties?: { name?: string; NAME?: string } }>; properties?: { name?: string; NAME?: string } };

  if (geoJsonTyped.features && geoJsonTyped.features[0]?.properties) {
    const props = geoJsonTyped.features[0].properties;
    name = props.name || props.NAME || "";
  } else if (geoJsonTyped.properties) {
    name = geoJsonTyped.properties.name || geoJsonTyped.properties.NAME || "";
  }

  // Fallback to filename
  if (!name) {
    name = fileName.replace(/\.(geo)?json$/i, "").replace(/[-_]/g, " ");
    // Capitalize first letter
    name = name.charAt(0).toUpperCase() + name.slice(1);
  }

  // Generate ID from name
  const id = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  return {
    name,
    id,
    bounds: {
      north: maxLat,
      south: minLat,
      east: maxLng,
      west: minLng,
    },
    center: {
      lat: (minLat + maxLat) / 2,
      lng: (minLng + maxLng) / 2,
    },
  };
}

export function CountriesTab({ countries, onAdd, onDelete, onUpdate }: CountriesTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state - simplified
  const [formData, setFormData] = useState({
    name: "",
    icon: "",
    timeoutPenalty: "300",
    scoreScaleFactor: "80",
    defaultZoom: "8",
    geoJsonData: "",
    parsedData: null as ParsedGeoJson | null,
    fileName: "",
  });

  // Edit modal state
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    country: Country | null;
    name: string;
    icon: string;
    timeoutPenalty: string;
    scoreScaleFactor: string;
    defaultZoom: string;
    geoJsonData: string;
    fileName: string;
  }>({
    isOpen: false,
    country: null,
    name: "",
    icon: "",
    timeoutPenalty: "",
    scoreScaleFactor: "",
    defaultZoom: "",
    geoJsonData: "",
    fileName: "",
  });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    countryId: string | null;
    countryName: string;
  }>({
    isOpen: false,
    countryId: null,
    countryName: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      icon: "",
      timeoutPenalty: "300",
      scoreScaleFactor: "80",
      defaultZoom: "8",
      geoJsonData: "",
      parsedData: null,
      fileName: "",
    });
    setError("");
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const geoJson = JSON.parse(text);
      const parsed = parseGeoJson(geoJson, file.name);

      if (isEdit) {
        setEditModal((prev) => ({
          ...prev,
          geoJsonData: text,
          fileName: file.name,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          name: prev.name || parsed.name, // Pre-fill name from GeoJSON if not already set
          geoJsonData: text,
          parsedData: parsed,
          fileName: file.name,
        }));
      }
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ungültige GeoJSON-Datei");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.geoJsonData || !formData.parsedData) {
      setError("Bitte lade eine GeoJSON-Datei hoch");
      return;
    }

    setSaving(true);

    const { parsedData } = formData;
    const displayName = formData.name || parsedData.name;

    const success = await onAdd({
      id: parsedData.id,
      name: displayName,
      nameEn: displayName, // Use same name for English and Slovenian
      nameSl: displayName,
      icon: formData.icon || "🏴",
      centerLat: parsedData.center.lat,
      centerLng: parsedData.center.lng,
      defaultZoom: parseInt(formData.defaultZoom),
      minZoom: Math.max(1, parseInt(formData.defaultZoom) - 1),
      boundsNorth: parsedData.bounds.north,
      boundsSouth: parsedData.bounds.south,
      boundsEast: parsedData.bounds.east,
      boundsWest: parsedData.bounds.west,
      timeoutPenalty: parseInt(formData.timeoutPenalty),
      scoreScaleFactor: parseInt(formData.scoreScaleFactor),
      isActive: true,
      geoJsonData: formData.geoJsonData,
    });

    setSaving(false);

    if (success) {
      resetForm();
      setShowForm(false);
    } else {
      setError("Fehler beim Speichern - möglicherweise existiert die ID bereits");
    }
  };

  const handleEditSubmit = async () => {
    if (!editModal.country) return;

    setSaving(true);
    setError("");

    const updateData: Partial<Country> & { geoJsonData?: string } = {
      name: editModal.name,
      nameEn: editModal.name,
      nameSl: editModal.name,
      icon: editModal.icon,
      timeoutPenalty: parseInt(editModal.timeoutPenalty),
      scoreScaleFactor: parseInt(editModal.scoreScaleFactor),
      defaultZoom: parseInt(editModal.defaultZoom),
      minZoom: Math.max(1, parseInt(editModal.defaultZoom) - 1),
    };

    // If new GeoJSON was uploaded, parse and include it
    if (editModal.geoJsonData) {
      try {
        const geoJson = JSON.parse(editModal.geoJsonData);
        const parsed = parseGeoJson(geoJson, editModal.fileName);
        updateData.boundsNorth = parsed.bounds.north;
        updateData.boundsSouth = parsed.bounds.south;
        updateData.boundsEast = parsed.bounds.east;
        updateData.boundsWest = parsed.bounds.west;
        updateData.centerLat = parsed.center.lat;
        updateData.centerLng = parsed.center.lng;
        updateData.geoJsonData = editModal.geoJsonData;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ungültige GeoJSON-Datei");
        setSaving(false);
        return;
      }
    }

    const success = await onUpdate(editModal.country.id, updateData);
    setSaving(false);

    if (success) {
      setEditModal({
        isOpen: false,
        country: null,
        name: "",
        icon: "",
        timeoutPenalty: "",
        scoreScaleFactor: "",
        defaultZoom: "",
        geoJsonData: "",
        fileName: "",
      });
    } else {
      setError("Fehler beim Speichern");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.countryId) return;
    await onDelete(deleteModal.countryId);
    setDeleteModal({ isOpen: false, countryId: null, countryName: "" });
  };

  const openEditModal = (country: Country) => {
    setEditModal({
      isOpen: true,
      country,
      name: country.name,
      icon: country.icon,
      timeoutPenalty: country.timeoutPenalty.toString(),
      scoreScaleFactor: country.scoreScaleFactor.toString(),
      defaultZoom: country.defaultZoom.toString(),
      geoJsonData: "",
      fileName: "",
    });
    setError("");
  };

  const toggleActive = async (country: Country) => {
    await onUpdate(country.id, { isActive: !country.isActive });
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header with Add button */}
        <div className="flex items-center justify-between">
          <h2 className="text-h2 text-text-primary">Länder verwalten</h2>
          {!showForm && (
            <Button variant="primary" onClick={() => setShowForm(true)}>
              Neues Land hinzufügen
            </Button>
          )}
        </div>

        {/* Add country form - simplified */}
        {showForm && (
          <Card variant="surface" padding="lg">
            <h3 className="text-h3 text-text-primary mb-6">Neues Land hinzufügen</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* GeoJSON Upload */}
              <div>
                <label className="block text-body-small font-medium text-text-primary mb-2">
                  GeoJSON-Datei *
                </label>
                <input
                  type="file"
                  accept=".json,.geojson"
                  onChange={(e) => handleFileSelect(e, false)}
                  className="block w-full text-sm text-text-secondary
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-white
                    hover:file:bg-primary/90
                    cursor-pointer"
                />
                {formData.parsedData && (
                  <div className="mt-3 p-3 bg-success/10 border border-success/30 rounded-lg">
                    <p className="text-success font-medium">
                      ✓ {formData.fileName} ({Math.round(formData.geoJsonData.length / 1024)} KB)
                    </p>
                    <p className="text-text-secondary text-sm mt-1">
                      Erkannt: <span className="font-medium">{formData.parsedData.name}</span> (ID: {formData.parsedData.id})
                    </p>
                  </div>
                )}
              </div>

              {/* Name and Icon */}
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Name (Deutsch)"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={formData.parsedData?.name || "z.B. Deutschland"}
                />
                <FlagPicker
                  value={formData.icon}
                  onChange={(emoji) => setFormData((prev) => ({ ...prev, icon: emoji }))}
                />
              </div>

              {/* Settings */}
              <div className="grid gap-4 md:grid-cols-3">
                <Input
                  label="Timeout-Strafe (km)"
                  type="number"
                  value={formData.timeoutPenalty}
                  onChange={(e) => setFormData((prev) => ({ ...prev, timeoutPenalty: e.target.value }))}
                  required
                />
                <Input
                  label="Score-Faktor (km)"
                  type="number"
                  value={formData.scoreScaleFactor}
                  onChange={(e) => setFormData((prev) => ({ ...prev, scoreScaleFactor: e.target.value }))}
                  required
                />
                <Input
                  label="Default Zoom"
                  type="number"
                  value={formData.defaultZoom}
                  onChange={(e) => setFormData((prev) => ({ ...prev, defaultZoom: e.target.value }))}
                  required
                />
              </div>

              {error && <p className="text-error text-body-small">{error}</p>}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={saving}
                  disabled={!formData.parsedData}
                >
                  Land hinzufügen
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Country list */}
        <Card variant="surface" padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-2 border-b border-glass-border">
                <tr>
                  <th className="text-left px-6 py-3 text-caption font-medium text-text-secondary">Land</th>
                  <th className="text-center px-6 py-3 text-caption font-medium text-text-secondary">Orte</th>
                  <th className="text-center px-6 py-3 text-caption font-medium text-text-secondary">Einstellungen</th>
                  <th className="text-center px-6 py-3 text-caption font-medium text-text-secondary">Status</th>
                  <th className="text-right px-6 py-3 text-caption font-medium text-text-secondary">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {countries.map((country) => (
                  <tr key={country.id} className="hover:bg-surface-2/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{country.icon}</span>
                        <div>
                          <p className="font-medium text-text-primary">{country.name}</p>
                          <p className="text-caption text-text-muted">{country.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="default">{country.locationCount}</Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-caption text-text-muted">
                        <span title="Timeout-Strafe">⏱️ {country.timeoutPenalty}km</span>
                        <span className="mx-2">|</span>
                        <span title="Score-Faktor">📊 {country.scoreScaleFactor}km</span>
                        <span className="mx-2">|</span>
                        <span title="Zoom">🔍 {country.defaultZoom}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleActive(country)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          country.isActive
                            ? "bg-success/20 text-success hover:bg-success/30"
                            : "bg-surface-3 text-text-muted hover:bg-surface-2"
                        }`}
                      >
                        {country.isActive ? "Aktiv" : "Inaktiv"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(country)}
                      >
                        Bearbeiten
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setDeleteModal({
                            isOpen: true,
                            countryId: country.id,
                            countryName: country.name,
                          })
                        }
                        className="text-error hover:text-error hover:bg-error/10"
                      >
                        Löschen
                      </Button>
                    </td>
                  </tr>
                ))}
                {countries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                      Keine Länder vorhanden
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Edit Modal */}
      {editModal.isOpen && editModal.country && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <Card variant="elevated" padding="lg" className="w-full max-w-md mx-4">
            <h2 className="text-h3 text-text-primary mb-6">
              {editModal.country.name} bearbeiten
            </h2>

            <div className="space-y-4">
              {/* Name and Icon */}
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Name (Deutsch)"
                  type="text"
                  value={editModal.name}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, name: e.target.value }))}
                />
                <FlagPicker
                  value={editModal.icon}
                  onChange={(emoji) => setEditModal((prev) => ({ ...prev, icon: emoji }))}
                />
              </div>

              {/* Settings */}
              <Input
                label="Timeout-Strafe (km)"
                type="number"
                value={editModal.timeoutPenalty}
                onChange={(e) => setEditModal((prev) => ({ ...prev, timeoutPenalty: e.target.value }))}
              />
              <Input
                label="Score-Faktor (km)"
                type="number"
                value={editModal.scoreScaleFactor}
                onChange={(e) => setEditModal((prev) => ({ ...prev, scoreScaleFactor: e.target.value }))}
              />
              <Input
                label="Default Zoom"
                type="number"
                value={editModal.defaultZoom}
                onChange={(e) => setEditModal((prev) => ({ ...prev, defaultZoom: e.target.value }))}
              />

              <div>
                <label className="block text-body-small font-medium text-text-primary mb-2">
                  Neues GeoJSON hochladen (optional)
                </label>
                <input
                  type="file"
                  accept=".json,.geojson"
                  onChange={(e) => handleFileSelect(e, true)}
                  className="block w-full text-sm text-text-secondary
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-surface-3 file:text-text-primary
                    hover:file:bg-surface-2
                    cursor-pointer"
                />
                {editModal.fileName && (
                  <p className="text-caption text-success mt-2">
                    ✓ {editModal.fileName} ({Math.round(editModal.geoJsonData.length / 1024)} KB)
                  </p>
                )}
              </div>
            </div>

            {error && <p className="text-error text-body-small mt-4">{error}</p>}

            <div className="flex gap-3 mt-6">
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setEditModal({
                    isOpen: false,
                    country: null,
                    name: "",
                    icon: "",
                    timeoutPenalty: "",
                    scoreScaleFactor: "",
                    defaultZoom: "",
                    geoJsonData: "",
                    fileName: "",
                  });
                  setError("");
                }}
                disabled={saving}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleEditSubmit}
                isLoading={saving}
                className="flex-1"
              >
                Speichern
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Land löschen"
        message={`Möchtest du "${deleteModal.countryName}" wirklich löschen? Alle zugehörigen Orte bleiben erhalten.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, countryId: null, countryName: "" })}
      />
    </>
  );
}
