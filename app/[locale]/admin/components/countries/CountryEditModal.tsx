"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { EmojiPicker } from "@/components/ui/EmojiPicker";
import { FLAG_OPTIONS, parseGeoJson } from "./constants";
import type { Country } from "../../types";

interface CountryEditModalProps {
  country: Country;
  onSave: (countryId: string, data: Partial<Country> & { geoJsonData?: string }) => Promise<boolean>;
  onClose: () => void;
}

export function CountryEditModal({ country, onSave, onClose }: CountryEditModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: country.name,
    icon: country.icon,
    timeoutPenalty: country.timeoutPenalty.toString(),
    scoreScaleFactor: country.scoreScaleFactor.toString(),
    defaultZoom: country.defaultZoom.toString(),
    geoJsonData: "",
    fileName: "",
  });

  // Reset form when country changes
  useEffect(() => {
    setFormData({
      name: country.name,
      icon: country.icon,
      timeoutPenalty: country.timeoutPenalty.toString(),
      scoreScaleFactor: country.scoreScaleFactor.toString(),
      defaultZoom: country.defaultZoom.toString(),
      geoJsonData: "",
      fileName: "",
    });
    setError("");
  }, [country]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      JSON.parse(text); // Validate JSON
      setFormData((prev) => ({
        ...prev,
        geoJsonData: text,
        fileName: file.name,
      }));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ungültige GeoJSON-Datei");
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");

    const updateData: Partial<Country> & { geoJsonData?: string } = {
      name: formData.name,
      nameEn: formData.name,
      nameSl: formData.name,
      icon: formData.icon,
      timeoutPenalty: parseInt(formData.timeoutPenalty),
      scoreScaleFactor: parseInt(formData.scoreScaleFactor),
      defaultZoom: parseInt(formData.defaultZoom),
      minZoom: Math.max(1, parseInt(formData.defaultZoom) - 1),
    };

    if (formData.geoJsonData) {
      try {
        const geoJson = JSON.parse(formData.geoJsonData);
        const parsed = parseGeoJson(geoJson, formData.fileName);
        updateData.boundsNorth = parsed.bounds.north;
        updateData.boundsSouth = parsed.bounds.south;
        updateData.boundsEast = parsed.bounds.east;
        updateData.boundsWest = parsed.bounds.west;
        updateData.centerLat = parsed.center.lat;
        updateData.centerLng = parsed.center.lng;
        updateData.geoJsonData = formData.geoJsonData;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ungültige GeoJSON-Datei");
        setSaving(false);
        return;
      }
    }

    const success = await onSave(country.id, updateData);
    setSaving(false);

    if (success) {
      onClose();
    } else {
      setError("Fehler beim Speichern");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <Card variant="elevated" padding="lg" className="w-full max-w-md mx-4">
        <h2 className="text-h3 text-text-primary mb-6">{country.name} bearbeiten</h2>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Name (Deutsch)"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            />
            <EmojiPicker
              label="Flagge"
              value={formData.icon}
              onChange={(emoji) => setFormData((prev) => ({ ...prev, icon: emoji }))}
              options={FLAG_OPTIONS}
            />
          </div>

          <Input
            label="Timeout-Strafe (km)"
            type="number"
            value={formData.timeoutPenalty}
            onChange={(e) => setFormData((prev) => ({ ...prev, timeoutPenalty: e.target.value }))}
          />
          <Input
            label="Score-Faktor (km)"
            type="number"
            value={formData.scoreScaleFactor}
            onChange={(e) => setFormData((prev) => ({ ...prev, scoreScaleFactor: e.target.value }))}
          />
          <Input
            label="Default Zoom"
            type="number"
            value={formData.defaultZoom}
            onChange={(e) => setFormData((prev) => ({ ...prev, defaultZoom: e.target.value }))}
          />

          <div>
            <label className="block text-body-small font-medium text-text-primary mb-2">
              Neues GeoJSON hochladen (optional)
            </label>
            <input
              type="file"
              accept=".json,.geojson"
              onChange={handleFileSelect}
              className="block w-full text-sm text-text-secondary
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-surface-3 file:text-text-primary
                hover:file:bg-surface-2
                cursor-pointer"
            />
            {formData.fileName && (
              <p className="text-caption text-success mt-2">
                ✓ {formData.fileName} ({Math.round(formData.geoJsonData.length / 1024)} KB)
              </p>
            )}
          </div>
        </div>

        {error && <p className="text-error text-body-small mt-4">{error}</p>}

        <div className="flex gap-3 mt-6">
          <Button
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={saving}
            className="flex-1"
          >
            Abbrechen
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            isLoading={saving}
            className="flex-1"
          >
            Speichern
          </Button>
        </div>
      </Card>
    </div>
  );
}
