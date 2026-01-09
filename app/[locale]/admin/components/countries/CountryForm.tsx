"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { EmojiPicker } from "@/components/ui/EmojiPicker";
import { FLAG_OPTIONS, parseGeoJson, type ParsedGeoJson } from "./constants";
import type { Country } from "../../types";

interface CountryFormProps {
  onAdd: (country: Omit<Country, "createdAt" | "locationCount"> & { geoJsonData?: string }) => Promise<boolean>;
  onCancel: () => void;
}

export function CountryForm({ onAdd, onCancel }: CountryFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const geoJson = JSON.parse(text);
      const parsed = parseGeoJson(geoJson, file.name);

      setFormData((prev) => ({
        ...prev,
        name: prev.name || parsed.name,
        geoJsonData: text,
        parsedData: parsed,
        fileName: file.name,
      }));
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
      nameEn: displayName,
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
      onCancel();
    } else {
      setError("Fehler beim Speichern - möglicherweise existiert die ID bereits");
    }
  };

  return (
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
            onChange={handleFileSelect}
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
          <EmojiPicker
            label="Flagge"
            value={formData.icon}
            onChange={(emoji) => setFormData((prev) => ({ ...prev, icon: emoji }))}
            options={FLAG_OPTIONS}
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
          <Button type="button" variant="ghost" onClick={onCancel}>
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
  );
}
