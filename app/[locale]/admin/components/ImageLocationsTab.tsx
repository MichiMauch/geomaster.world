"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import ConfirmModal from "@/components/ConfirmModal";
import { getGameTypesByTypeExtended } from "@/lib/game-types";
import type { ImageLocation } from "../types";

// Dynamic import for ImageMap to avoid SSR issues with Leaflet
const ImageMap = dynamic(() => import("@/components/Map/ImageMap"), { ssr: false });

interface ImageLocationsTabProps {
  imageLocations: ImageLocation[];
  onFetch: (imageMapId: string) => Promise<void>;
  onAdd: (imageMapId: string, name: string, x: number, y: number, difficulty: string) => Promise<boolean>;
  onDelete: (locationId: string) => Promise<void>;
}

const difficultyOptions = [
  { value: "easy", label: "Einfach" },
  { value: "medium", label: "Mittel" },
  { value: "hard", label: "Schwer" },
];

export function ImageLocationsTab({ imageLocations, onFetch, onAdd, onDelete }: ImageLocationsTabProps) {
  const [selectedImageMap, setSelectedImageMap] = useState("");
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    locationId: string | null;
    locationName: string;
  }>({
    isOpen: false,
    locationId: null,
    locationName: "",
  });

  const imageGameTypes = getGameTypesByTypeExtended().image;

  // Fetch locations when map selection changes
  useEffect(() => {
    if (selectedImageMap) {
      onFetch(selectedImageMap);
    }
  }, [selectedImageMap, onFetch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!markerPosition) {
      setError("Bitte setze einen Marker auf dem Bild");
      return;
    }
    if (!selectedImageMap) {
      setError("Bitte wähle eine Bild-Karte aus");
      return;
    }

    setSaving(true);
    setError("");

    const success = await onAdd(
      selectedImageMap,
      locationName,
      markerPosition.lng, // lng = x
      markerPosition.lat, // lat = y
      difficulty
    );

    if (success) {
      setLocationName("");
      setMarkerPosition(null);
      setDifficulty("medium");
    } else {
      setError("Fehler beim Speichern des Ortes");
    }

    setSaving(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.locationId) return;
    await onDelete(deleteModal.locationId);
    setDeleteModal({ isOpen: false, locationId: null, locationName: "" });
  };

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Add new image location */}
        <Card variant="surface" padding="lg">
          <h2 className="text-h3 text-text-primary mb-6">Neuen Bild-Ort hinzufügen</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-body-small font-medium text-text-primary mb-2">
                Bild-Karte auswählen
              </label>
              <select
                value={selectedImageMap}
                onChange={(e) => {
                  setSelectedImageMap(e.target.value);
                  setMarkerPosition(null);
                }}
                className="w-full px-4 py-3 rounded-lg bg-surface-2 border border-glass-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Bild wählen --</option>
                {imageGameTypes.map((gt) => (
                  <option key={gt.id} value={gt.id.replace("image:", "")}>
                    {gt.icon} {gt.name.de}
                  </option>
                ))}
              </select>
            </div>

            {selectedImageMap && (
              <>
                <div>
                  <label className="block text-body-small font-medium text-text-primary mb-2">
                    Position auf dem Bild setzen
                  </label>
                  <div className="rounded-lg overflow-hidden border border-glass-border">
                    <ImageMap
                      gameType={`image:${selectedImageMap}`}
                      onMarkerPlace={setMarkerPosition}
                      markerPosition={markerPosition}
                      height="300px"
                    />
                  </div>
                  {markerPosition && (
                    <p className="text-caption text-text-muted mt-2">
                      Koordinaten: x={Math.round(markerPosition.lng)}, y={Math.round(markerPosition.lat)}
                    </p>
                  )}
                </div>

                <Input
                  label="Ortsname"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="z.B. Gewächshaus"
                  required
                />

                <div className="space-y-2">
                  <label className="block text-body-small font-medium text-text-primary">
                    Schwierigkeit
                  </label>
                  <div className="flex gap-2">
                    {difficultyOptions.map((option) => (
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
              </>
            )}

            {error && <p className="text-error text-body-small">{error}</p>}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={!selectedImageMap || !locationName || !markerPosition}
              isLoading={saving}
            >
              Bild-Ort hinzufügen
            </Button>
          </form>
        </Card>

        {/* Image location list */}
        <Card variant="surface" padding="lg">
          <h2 className="text-h3 text-text-primary mb-6">
            Vorhandene Bild-Orte ({imageLocations.length})
          </h2>

          {!selectedImageMap ? (
            <p className="text-text-muted text-center py-8">
              Wähle eine Bild-Karte aus, um die Orte zu sehen.
            </p>
          ) : imageLocations.length === 0 ? (
            <p className="text-text-muted text-center py-8">
              Noch keine Orte für diese Karte vorhanden.
            </p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {imageLocations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors"
                >
                  <div>
                    <p className="font-medium text-text-primary">
                      {location.name}
                    </p>
                    <p className="text-caption text-text-muted">
                      x={Math.round(location.x)}, y={Math.round(location.y)}
                    </p>
                    <Badge
                      variant={
                        location.difficulty === "easy"
                          ? "success"
                          : location.difficulty === "medium"
                          ? "warning"
                          : "error"
                      }
                      size="sm"
                    >
                      {location.difficulty === "easy"
                        ? "Einfach"
                        : location.difficulty === "medium"
                        ? "Mittel"
                        : "Schwer"}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteModal({ isOpen: true, locationId: location.id, locationName: location.name })}
                    className="text-error hover:text-error hover:bg-error/10"
                  >
                    Löschen
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Bild-Ort löschen"
        message={`Möchtest du "${deleteModal.locationName}" wirklich löschen?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, locationId: null, locationName: "" })}
      />
    </>
  );
}
