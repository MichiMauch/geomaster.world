"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { DIFFICULTY_OPTIONS } from "./constants";
import type { WorldQuizType } from "../../types";

interface WorldLocationFormProps {
  selectedCategory: WorldQuizType;
  onAdd: (category: string, name: string, lat: number, lng: number, countryCode: string, difficulty: string) => Promise<boolean>;
}

export function WorldLocationForm({ selectedCategory, onAdd }: WorldLocationFormProps) {
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

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
      selectedCategory.id,
      locationName.trim(),
      lat,
      lng,
      countryCode.trim().toUpperCase(),
      difficulty
    );

    if (success) {
      setLocationName("");
      setLatitude("");
      setLongitude("");
      setCountryCode("");
      setDifficulty("medium");
    }

    setSaving(false);
  };

  return (
    <Card variant="surface" padding="lg">
      <h3 className="text-h3 text-text-primary mb-4">
        Ort zu &quot;{selectedCategory.name}&quot; hinzufügen
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
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
              {DIFFICULTY_OPTIONS.map((opt) => (
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
  );
}
