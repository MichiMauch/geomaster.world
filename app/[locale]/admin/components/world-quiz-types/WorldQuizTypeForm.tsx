"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { EmojiPicker } from "@/components/ui/EmojiPicker";
import { ICON_OPTIONS, DEFAULT_FORM_VALUES } from "./constants";
import type { WorldQuizType } from "../../types";

interface WorldQuizTypeFormProps {
  onAdd: (quizType: Omit<WorldQuizType, "createdAt" | "locationCount">) => Promise<boolean>;
  onCancel: () => void;
}

export function WorldQuizTypeForm({ onAdd, onCancel }: WorldQuizTypeFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState(DEFAULT_FORM_VALUES);

  const resetForm = () => {
    setFormData(DEFAULT_FORM_VALUES);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.id || !formData.name || !formData.icon) {
      setError("Bitte ID, Name und Icon ausfüllen");
      return;
    }

    // Validate ID format (lowercase, no spaces)
    const idRegex = /^[a-z0-9-]+$/;
    if (!idRegex.test(formData.id)) {
      setError("ID darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten");
      return;
    }

    setSaving(true);

    const success = await onAdd({
      id: formData.id,
      name: formData.name,
      nameEn: null,
      nameSl: null,
      icon: formData.icon,
      centerLat: parseFloat(formData.centerLat),
      centerLng: parseFloat(formData.centerLng),
      defaultZoom: parseInt(formData.defaultZoom),
      minZoom: parseInt(formData.minZoom),
      timeoutPenalty: parseInt(formData.timeoutPenalty),
      scoreScaleFactor: parseInt(formData.scoreScaleFactor),
      isActive: true,
    });

    setSaving(false);

    if (success) {
      resetForm();
      onCancel();
    } else {
      setError("Fehler beim Speichern - möglicherweise existiert die ID bereits");
    }
  };

  return (
    <Card variant="surface" padding="lg">
      <h3 className="text-h3 text-text-primary mb-6">Neuen Welt-Quiz-Typ hinzufügen</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ID, Name and Icon */}
        <div className="grid gap-4 md:grid-cols-3">
          <Input
            label="ID (eindeutig, z.B. 'famous-stadiums')"
            type="text"
            value={formData.id}
            onChange={(e) => setFormData((prev) => ({ ...prev, id: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
            placeholder="z.B. famous-stadiums"
            required
          />
          <Input
            label="Name (Deutsch)"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="z.B. Berühmte Stadien"
            required
          />
          <EmojiPicker
            label="Icon"
            value={formData.icon}
            onChange={(emoji) => setFormData((prev) => ({ ...prev, icon: emoji }))}
            options={ICON_OPTIONS}
          />
        </div>

        {/* Map Settings */}
        <div className="grid gap-4 md:grid-cols-4">
          <Input
            label="Center Lat"
            type="number"
            step="any"
            value={formData.centerLat}
            onChange={(e) => setFormData((prev) => ({ ...prev, centerLat: e.target.value }))}
            required
          />
          <Input
            label="Center Lng"
            type="number"
            step="any"
            value={formData.centerLng}
            onChange={(e) => setFormData((prev) => ({ ...prev, centerLng: e.target.value }))}
            required
          />
          <Input
            label="Default Zoom"
            type="number"
            value={formData.defaultZoom}
            onChange={(e) => setFormData((prev) => ({ ...prev, defaultZoom: e.target.value }))}
            required
          />
          <Input
            label="Min Zoom"
            type="number"
            value={formData.minZoom}
            onChange={(e) => setFormData((prev) => ({ ...prev, minZoom: e.target.value }))}
            required
          />
        </div>

        {/* Scoring Settings */}
        <div className="grid gap-4 md:grid-cols-2">
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
        </div>

        {error && <p className="text-error text-body-small">{error}</p>}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              resetForm();
              onCancel();
            }}
          >
            Abbrechen
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={saving}
          >
            Typ hinzufügen
          </Button>
        </div>
      </form>
    </Card>
  );
}
