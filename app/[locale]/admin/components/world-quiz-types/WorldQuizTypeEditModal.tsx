"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { EmojiPicker } from "@/components/ui/EmojiPicker";
import { ICON_OPTIONS } from "./constants";
import type { WorldQuizType } from "../../types";

interface WorldQuizTypeEditModalProps {
  quizType: WorldQuizType;
  onSave: (quizTypeId: string, data: Partial<WorldQuizType>) => Promise<boolean>;
  onClose: () => void;
}

export function WorldQuizTypeEditModal({ quizType, onSave, onClose }: WorldQuizTypeEditModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: quizType.name,
    icon: quizType.icon,
    centerLat: quizType.centerLat.toString(),
    centerLng: quizType.centerLng.toString(),
    defaultZoom: quizType.defaultZoom.toString(),
    minZoom: quizType.minZoom.toString(),
    timeoutPenalty: quizType.timeoutPenalty.toString(),
    scoreScaleFactor: quizType.scoreScaleFactor.toString(),
  });

  // Reset form when quizType changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Syncing props to state is intentional
    setFormData({
      name: quizType.name,
      icon: quizType.icon,
      centerLat: quizType.centerLat.toString(),
      centerLng: quizType.centerLng.toString(),
      defaultZoom: quizType.defaultZoom.toString(),
      minZoom: quizType.minZoom.toString(),
      timeoutPenalty: quizType.timeoutPenalty.toString(),
      scoreScaleFactor: quizType.scoreScaleFactor.toString(),
    });
    setError("");
  }, [quizType]);

  const handleSubmit = async () => {
    setSaving(true);
    setError("");

    const success = await onSave(quizType.id, {
      name: formData.name,
      icon: formData.icon,
      centerLat: parseFloat(formData.centerLat),
      centerLng: parseFloat(formData.centerLng),
      defaultZoom: parseInt(formData.defaultZoom),
      minZoom: parseInt(formData.minZoom),
      timeoutPenalty: parseInt(formData.timeoutPenalty),
      scoreScaleFactor: parseInt(formData.scoreScaleFactor),
    });

    setSaving(false);

    if (success) {
      onClose();
    } else {
      setError("Fehler beim Speichern");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <Card variant="elevated" padding="lg" className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-h3 text-text-primary mb-6">{quizType.name} bearbeiten</h2>

        <div className="space-y-4">
          {/* Name and Icon */}
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Name (Deutsch)"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            />
            <EmojiPicker
              label="Icon"
              value={formData.icon}
              onChange={(emoji) => setFormData((prev) => ({ ...prev, icon: emoji }))}
              options={ICON_OPTIONS}
            />
          </div>

          {/* Map Settings */}
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Center Lat"
              type="number"
              step="any"
              value={formData.centerLat}
              onChange={(e) => setFormData((prev) => ({ ...prev, centerLat: e.target.value }))}
            />
            <Input
              label="Center Lng"
              type="number"
              step="any"
              value={formData.centerLng}
              onChange={(e) => setFormData((prev) => ({ ...prev, centerLng: e.target.value }))}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Default Zoom"
              type="number"
              value={formData.defaultZoom}
              onChange={(e) => setFormData((prev) => ({ ...prev, defaultZoom: e.target.value }))}
            />
            <Input
              label="Min Zoom"
              type="number"
              value={formData.minZoom}
              onChange={(e) => setFormData((prev) => ({ ...prev, minZoom: e.target.value }))}
            />
          </div>

          {/* Scoring Settings */}
          <div className="grid gap-4 md:grid-cols-2">
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
