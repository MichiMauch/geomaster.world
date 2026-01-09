"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { DIFFICULTY_OPTIONS } from "./constants";
import type { Country } from "../../types";

const CountryMap = dynamic(() => import("@/components/Map/CountryMap"), { ssr: false });

interface SingleLocationFormProps {
  country: Country;
  onAdd: (country: string, name: string, lat: number, lng: number, difficulty: string) => Promise<boolean>;
}

export function SingleLocationForm({ country, onAdd }: SingleLocationFormProps) {
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const handleMapClick = (position: { lat: number; lng: number }) => {
    setMarkerPosition(position);
    setLatitude(position.lat.toFixed(6));
    setLongitude(position.lng.toFixed(6));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

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
      country.nameEn || country.name,
      locationName.trim(),
      lat,
      lng,
      difficulty
    );

    if (success) {
      setLocationName("");
      setLatitude("");
      setLongitude("");
      setDifficulty("medium");
      setMarkerPosition(null);
    }

    setSaving(false);
  };

  return (
    <Card variant="surface" padding="lg">
      <h2 className="text-h3 text-text-primary mb-6">Einzelnen Ort hinzufügen</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* Optional Map preview */}
        <div>
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="flex items-center gap-2 text-body-small font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            <span className="text-sm">{showMap ? "▼" : "▶"}</span>
            <span>Karte {showMap ? "ausblenden" : "anzeigen"} (optional)</span>
          </button>

          {showMap && (
            <div className="mt-3">
              <div className="rounded-lg overflow-hidden border border-glass-border">
                <CountryMap
                  dynamicCountry={{
                    id: country.id,
                    centerLat: country.centerLat,
                    centerLng: country.centerLng,
                    boundsNorth: country.boundsNorth,
                    boundsSouth: country.boundsSouth,
                    boundsEast: country.boundsEast,
                    boundsWest: country.boundsWest,
                    defaultZoom: country.defaultZoom,
                    minZoom: country.minZoom,
                  }}
                  onMarkerPlace={handleMapClick}
                  markerPosition={markerPosition}
                  height="300px"
                />
              </div>
              <p className="text-caption text-text-muted mt-2">
                Klicke auf die Karte um die Position zu setzen.
              </p>
            </div>
          )}
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
            {DIFFICULTY_OPTIONS.map((option) => (
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
  );
}
