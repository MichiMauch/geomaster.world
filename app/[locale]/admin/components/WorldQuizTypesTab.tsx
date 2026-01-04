"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import ConfirmModal from "@/components/ConfirmModal";
import type { WorldQuizType } from "../types";

// Common emoji icons for world quiz types - grouped by category
const ICON_OPTIONS = [
  // Geographie & Landschaft
  { emoji: "🏔️", label: "Berge" },
  { emoji: "🌋", label: "Vulkane" },
  { emoji: "🏝️", label: "Inseln" },
  { emoji: "🌊", label: "Seen/Meere" },
  { emoji: "🏖️", label: "Strände" },
  { emoji: "🌲", label: "Wälder" },
  { emoji: "🏜️", label: "Wüsten" },
  { emoji: "🌍", label: "Welt" },
  // Gebäude & Architektur
  { emoji: "🏛️", label: "Hauptstädte" },
  { emoji: "🏰", label: "Burgen" },
  { emoji: "⛪", label: "Kirchen" },
  { emoji: "🗼", label: "Türme" },
  { emoji: "🌉", label: "Brücken" },
  { emoji: "🏛", label: "Museen" },
  { emoji: "🕌", label: "Moscheen" },
  { emoji: "⛩️", label: "Tempel" },
  // Transport & Reisen
  { emoji: "✈️", label: "Flughäfen" },
  { emoji: "🚂", label: "Bahnhöfe" },
  { emoji: "🚢", label: "Häfen" },
  { emoji: "🚁", label: "Heliports" },
  { emoji: "🗺️", label: "Orte" },
  // Motorsport & Racing
  { emoji: "🏎️", label: "Formel 1" },
  { emoji: "🏁", label: "Rennstrecken" },
  { emoji: "🚗", label: "Autos" },
  { emoji: "🏍️", label: "Motorrad" },
  // Sport
  { emoji: "🏟️", label: "Stadien" },
  { emoji: "⚽", label: "Fussball" },
  { emoji: "🎾", label: "Tennis" },
  { emoji: "⛳", label: "Golf" },
  { emoji: "🏀", label: "Basketball" },
  { emoji: "🏈", label: "Football" },
  { emoji: "⛷️", label: "Skigebiete" },
  { emoji: "🏊", label: "Schwimmen" },
  // Unterhaltung
  { emoji: "🎡", label: "Freizeitparks" },
  { emoji: "🎢", label: "Achterbahnen" },
  { emoji: "🎬", label: "Filmstudios" },
  { emoji: "🎭", label: "Theater" },
  // Natur & Tiere
  { emoji: "🦁", label: "Löwen/Safari" },
  { emoji: "🐘", label: "Elefanten" },
  { emoji: "🦒", label: "Giraffen" },
  { emoji: "🐧", label: "Pinguine" },
  { emoji: "🌸", label: "Blumen" },
  { emoji: "🌴", label: "Palmen" },
  // Sonstige
  { emoji: "🎯", label: "Zielscheibe" },
  { emoji: "🏳️", label: "Flaggen" },
];

// Icon picker component
function IconPicker({
  value,
  onChange,
  label = "Icon"
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
        <span className="text-2xl">{value || "🌍"}</span>
        <span className="text-text-muted text-sm">
          {ICON_OPTIONS.find(f => f.emoji === value)?.label || "Auswählen"}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-surface-2 border border-glass-border rounded-lg shadow-lg p-3 max-h-64 overflow-y-auto">
          <div className="grid grid-cols-6 gap-2">
            {ICON_OPTIONS.map((icon) => (
              <button
                key={icon.emoji}
                type="button"
                onClick={() => {
                  onChange(icon.emoji);
                  setIsOpen(false);
                }}
                className={`p-2 text-2xl rounded-lg transition-colors hover:bg-surface-3 ${
                  value === icon.emoji ? "bg-primary/20 ring-2 ring-primary" : ""
                }`}
                title={icon.label}
              >
                {icon.emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface WorldQuizTypesTabProps {
  worldQuizTypes: WorldQuizType[];
  onAdd: (quizType: Omit<WorldQuizType, "createdAt" | "locationCount">) => Promise<boolean>;
  onDelete: (quizTypeId: string) => Promise<void>;
  onUpdate: (quizTypeId: string, data: Partial<WorldQuizType>) => Promise<boolean>;
}

export function WorldQuizTypesTab({ worldQuizTypes, onAdd, onDelete, onUpdate }: WorldQuizTypesTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    icon: "🌍",
    centerLat: "20",
    centerLng: "0",
    defaultZoom: "2",
    minZoom: "1",
    timeoutPenalty: "5000",
    scoreScaleFactor: "3000",
  });

  // Edit modal state
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    quizType: WorldQuizType | null;
    name: string;
    icon: string;
    centerLat: string;
    centerLng: string;
    defaultZoom: string;
    minZoom: string;
    timeoutPenalty: string;
    scoreScaleFactor: string;
  }>({
    isOpen: false,
    quizType: null,
    name: "",
    icon: "",
    centerLat: "",
    centerLng: "",
    defaultZoom: "",
    minZoom: "",
    timeoutPenalty: "",
    scoreScaleFactor: "",
  });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    quizTypeId: string | null;
    quizTypeName: string;
  }>({
    isOpen: false,
    quizTypeId: null,
    quizTypeName: "",
  });

  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      icon: "🌍",
      centerLat: "20",
      centerLng: "0",
      defaultZoom: "2",
      minZoom: "1",
      timeoutPenalty: "5000",
      scoreScaleFactor: "3000",
    });
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
      nameEn: null, // Will be auto-translated by API
      nameSl: null, // Will be auto-translated by API
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
      setShowForm(false);
    } else {
      setError("Fehler beim Speichern - möglicherweise existiert die ID bereits");
    }
  };

  const handleEditSubmit = async () => {
    if (!editModal.quizType) return;

    setSaving(true);
    setError("");

    const success = await onUpdate(editModal.quizType.id, {
      name: editModal.name,
      icon: editModal.icon,
      centerLat: parseFloat(editModal.centerLat),
      centerLng: parseFloat(editModal.centerLng),
      defaultZoom: parseInt(editModal.defaultZoom),
      minZoom: parseInt(editModal.minZoom),
      timeoutPenalty: parseInt(editModal.timeoutPenalty),
      scoreScaleFactor: parseInt(editModal.scoreScaleFactor),
    });

    setSaving(false);

    if (success) {
      setEditModal({
        isOpen: false,
        quizType: null,
        name: "",
        icon: "",
        centerLat: "",
        centerLng: "",
        defaultZoom: "",
        minZoom: "",
        timeoutPenalty: "",
        scoreScaleFactor: "",
      });
    } else {
      setError("Fehler beim Speichern");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.quizTypeId) return;
    await onDelete(deleteModal.quizTypeId);
    setDeleteModal({ isOpen: false, quizTypeId: null, quizTypeName: "" });
  };

  const openEditModal = (quizType: WorldQuizType) => {
    setEditModal({
      isOpen: true,
      quizType,
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
  };

  const toggleActive = async (quizType: WorldQuizType) => {
    await onUpdate(quizType.id, { isActive: !quizType.isActive });
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header with Add button */}
        <div className="flex items-center justify-between">
          <h2 className="text-h2 text-text-primary">Welt-Quiz-Typen verwalten</h2>
          {!showForm && (
            <Button variant="primary" onClick={() => setShowForm(true)}>
              Neuen Typ hinzufügen
            </Button>
          )}
        </div>

        {/* Add quiz type form */}
        {showForm && (
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
                <IconPicker
                  value={formData.icon}
                  onChange={(emoji) => setFormData((prev) => ({ ...prev, icon: emoji }))}
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
                    setShowForm(false);
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
        )}

        {/* Quiz types list */}
        <Card variant="surface" padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-2 border-b border-glass-border">
                <tr>
                  <th className="text-left px-6 py-3 text-caption font-medium text-text-secondary">Typ</th>
                  <th className="text-center px-6 py-3 text-caption font-medium text-text-secondary">Orte</th>
                  <th className="text-center px-6 py-3 text-caption font-medium text-text-secondary">Einstellungen</th>
                  <th className="text-center px-6 py-3 text-caption font-medium text-text-secondary">Status</th>
                  <th className="text-right px-6 py-3 text-caption font-medium text-text-secondary">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {worldQuizTypes.map((quizType) => (
                  <tr key={quizType.id} className="hover:bg-surface-2/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{quizType.icon}</span>
                        <div>
                          <p className="font-medium text-text-primary">{quizType.name}</p>
                          <p className="text-caption text-text-muted">{quizType.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="default">{quizType.locationCount}</Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-caption text-text-muted">
                        <span title="Timeout-Strafe">⏱️ {quizType.timeoutPenalty}km</span>
                        <span className="mx-2">|</span>
                        <span title="Score-Faktor">📊 {quizType.scoreScaleFactor}km</span>
                        <span className="mx-2">|</span>
                        <span title="Zoom">🔍 {quizType.defaultZoom}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <ToggleSwitch
                        checked={quizType.isActive}
                        onChange={() => toggleActive(quizType)}
                        size="md"
                      />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(quizType)}
                      >
                        Bearbeiten
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setDeleteModal({
                            isOpen: true,
                            quizTypeId: quizType.id,
                            quizTypeName: quizType.name,
                          })
                        }
                        className="text-error hover:text-error hover:bg-error/10"
                      >
                        Löschen
                      </Button>
                    </td>
                  </tr>
                ))}
                {worldQuizTypes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                      Keine Welt-Quiz-Typen vorhanden
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Edit Modal */}
      {editModal.isOpen && editModal.quizType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <Card variant="elevated" padding="lg" className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-h3 text-text-primary mb-6">
              {editModal.quizType.name} bearbeiten
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
                <IconPicker
                  value={editModal.icon}
                  onChange={(emoji) => setEditModal((prev) => ({ ...prev, icon: emoji }))}
                />
              </div>

              {/* Map Settings */}
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Center Lat"
                  type="number"
                  step="any"
                  value={editModal.centerLat}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, centerLat: e.target.value }))}
                />
                <Input
                  label="Center Lng"
                  type="number"
                  step="any"
                  value={editModal.centerLng}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, centerLng: e.target.value }))}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Default Zoom"
                  type="number"
                  value={editModal.defaultZoom}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, defaultZoom: e.target.value }))}
                />
                <Input
                  label="Min Zoom"
                  type="number"
                  value={editModal.minZoom}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, minZoom: e.target.value }))}
                />
              </div>

              {/* Scoring Settings */}
              <div className="grid gap-4 md:grid-cols-2">
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
                    quizType: null,
                    name: "",
                    icon: "",
                    centerLat: "",
                    centerLng: "",
                    defaultZoom: "",
                    minZoom: "",
                    timeoutPenalty: "",
                    scoreScaleFactor: "",
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
        title="Welt-Quiz-Typ löschen"
        message={`Möchtest du "${deleteModal.quizTypeName}" wirklich löschen? Alle zugehörigen Orte bleiben erhalten.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, quizTypeId: null, quizTypeName: "" })}
      />
    </>
  );
}
