"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { EmojiPicker } from "@/components/ui/EmojiPicker";
import { FLAG_OPTIONS, parseGeoJson } from "./constants";
import { GeoJSONPreview } from "./GeoJSONPreview";
import type { Country } from "../../types";

interface CountryEditModalProps {
  country: Country;
  onSave: (countryId: string, data: Partial<Country> & { geoJsonData?: string }) => Promise<boolean>;
  onClose: () => void;
}

export function CountryEditModal({ country, onSave, onClose }: CountryEditModalProps) {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"landmark" | "background" | "card" | null>(null);
  const [fetchingFlag, setFetchingFlag] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: country.name,
    icon: country.icon,
    timeoutPenalty: country.timeoutPenalty.toString(),
    scoreScaleFactor: country.scoreScaleFactor.toString(),
    defaultZoom: country.defaultZoom.toString(),
    geoJsonData: "",
    fileName: "",
    landmarkImage: country.landmarkImage || "",
    backgroundImage: country.backgroundImage || "",
    cardImage: country.cardImage || "",
    flagImage: country.flagImage || "",
    isoCode: "",
  });

  // Reset form when country changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Syncing props to state is intentional
    setFormData({
      name: country.name,
      icon: country.icon,
      timeoutPenalty: country.timeoutPenalty.toString(),
      scoreScaleFactor: country.scoreScaleFactor.toString(),
      defaultZoom: country.defaultZoom.toString(),
      geoJsonData: "",
      fileName: "",
      landmarkImage: country.landmarkImage || "",
      backgroundImage: country.backgroundImage || "",
      cardImage: country.cardImage || "",
      flagImage: country.flagImage || "",
      isoCode: "",
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

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    imageType: "landmark" | "background" | "card"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(imageType);
    setError("");

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("countryId", country.id);
      formDataUpload.append("type", imageType);

      const response = await fetch("/api/upload/country-image", {
        method: "POST",
        body: formDataUpload,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload fehlgeschlagen");
      }

      // Update form state with new image path
      const fieldMap = {
        landmark: "landmarkImage",
        background: "backgroundImage",
        card: "cardImage",
      } as const;
      setFormData((prev) => ({
        ...prev,
        [fieldMap[imageType]]: result.path,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bild-Upload fehlgeschlagen");
    } finally {
      setUploading(null);
    }
  };

  const handleFetchFlag = async () => {
    if (!formData.isoCode || formData.isoCode.length !== 2) {
      setError("Bitte einen gültigen 2-stelligen ISO-Code eingeben (z.B. 'ch', 'de')");
      return;
    }

    setFetchingFlag(true);
    setError("");

    try {
      const response = await fetch("/api/countries/fetch-flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryId: country.id,
          isoCode: formData.isoCode,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Flagge konnte nicht geladen werden");
      }

      setFormData((prev) => ({
        ...prev,
        flagImage: result.path,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Flagge konnte nicht geladen werden");
    } finally {
      setFetchingFlag(false);
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
      landmarkImage: formData.landmarkImage || null,
      backgroundImage: formData.backgroundImage || null,
      cardImage: formData.cardImage || null,
      flagImage: formData.flagImage || null,
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] overflow-y-auto py-8">
      <Card variant="elevated" padding="lg" className="w-full max-w-2xl mx-4 my-auto">
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

          <div className="grid gap-4 md:grid-cols-3">
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
          </div>

          {/* Image Uploads */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Background Image */}
            <div>
              <label className="block text-body-small font-medium text-text-primary mb-2">
                Hintergrundbild
              </label>
              {formData.backgroundImage && (
                <div className="relative w-full h-24 mb-2 rounded-lg overflow-hidden bg-surface-2">
                  <Image
                    src={formData.backgroundImage}
                    alt="Background"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => handleImageUpload(e, "background")}
                disabled={uploading !== null}
                className="block w-full text-sm text-text-secondary
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-surface-3 file:text-text-primary
                  hover:file:bg-surface-2
                  cursor-pointer disabled:opacity-50"
              />
              {uploading === "background" && (
                <p className="text-caption text-primary mt-1">Wird hochgeladen...</p>
              )}
            </div>

            {/* Landmark Image */}
            <div>
              <label className="block text-body-small font-medium text-text-primary mb-2">
                Landmark-Bild
              </label>
              {formData.landmarkImage && (
                <div className="relative w-full h-24 mb-2 rounded-lg overflow-hidden bg-surface-2">
                  <Image
                    src={formData.landmarkImage}
                    alt="Landmark"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => handleImageUpload(e, "landmark")}
                disabled={uploading !== null}
                className="block w-full text-sm text-text-secondary
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-surface-3 file:text-text-primary
                  hover:file:bg-surface-2
                  cursor-pointer disabled:opacity-50"
              />
              {uploading === "landmark" && (
                <p className="text-caption text-primary mt-1">Wird hochgeladen...</p>
              )}
            </div>
          </div>

          {/* Card Image and Flag */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Card Image */}
            <div>
              <label className="block text-body-small font-medium text-text-primary mb-2">
                Card-Bild (Vorschau)
              </label>
              {formData.cardImage && (
                <div className="relative w-full h-24 mb-2 rounded-lg overflow-hidden bg-surface-2">
                  <Image
                    src={formData.cardImage}
                    alt="Card"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => handleImageUpload(e, "card")}
                disabled={uploading !== null}
                className="block w-full text-sm text-text-secondary
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-surface-3 file:text-text-primary
                  hover:file:bg-surface-2
                  cursor-pointer disabled:opacity-50"
              />
              {uploading === "card" && (
                <p className="text-caption text-primary mt-1">Wird hochgeladen...</p>
              )}
            </div>

            {/* Flag Image */}
            <div>
              <label className="block text-body-small font-medium text-text-primary mb-2">
                Flagge (animiert)
              </label>
              {formData.flagImage && (
                <div className="relative w-20 h-14 mb-2 rounded overflow-hidden bg-surface-2">
                  <Image
                    src={formData.flagImage}
                    alt="Flag"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ISO (z.B. ch)"
                  value={formData.isoCode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isoCode: e.target.value.toLowerCase() }))}
                  maxLength={2}
                  className="flex-1 px-3 py-2 text-sm bg-surface-2 border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleFetchFlag}
                  disabled={fetchingFlag || !formData.isoCode}
                  isLoading={fetchingFlag}
                >
                  Laden
                </Button>
              </div>
            </div>
          </div>

          {/* GeoJSON Upload */}
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
                {formData.fileName} ({Math.round(formData.geoJsonData.length / 1024)} KB)
              </p>
            )}
          </div>

          {/* GeoJSON Preview */}
          <div>
            <label className="block text-body-small font-medium text-text-primary mb-2">
              {formData.geoJsonData ? "Neue Kartenvorschau" : "Aktuelle Karte"}
            </label>
            <GeoJSONPreview
              geoJsonData={formData.geoJsonData || null}
              countryId={formData.geoJsonData ? undefined : country.id}
              height="150px"
            />
          </div>
        </div>

        {error && <p className="text-error text-body-small mt-4">{error}</p>}

        <div className="flex gap-3 mt-6">
          <Button
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={saving || uploading !== null || fetchingFlag}
            className="flex-1"
          >
            Abbrechen
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            isLoading={saving}
            disabled={uploading !== null || fetchingFlag}
            className="flex-1"
          >
            Speichern
          </Button>
        </div>
      </Card>
    </div>
  );
}
