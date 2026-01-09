"use client";

import React, { useState, memo, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { WorldLocation, WorldQuizType, TranslationStatus } from "../../types";

interface WorldLocationTableProps {
  worldLocations: WorldLocation[];
  selectedCategory: WorldQuizType;
  translationStatus: TranslationStatus | null;
  translating: boolean;
  onDelete: (locationId: string, locationName: string) => void;
  onTranslate: () => void;
}

interface WorldLocationRowProps {
  location: WorldLocation;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: (locationId: string, locationName: string) => void;
}

function getDifficultyBadge(diff: string) {
  switch (diff) {
    case "easy":
      return <Badge variant="success">Einfach</Badge>;
    case "hard":
      return <Badge variant="error">Schwer</Badge>;
    default:
      return <Badge variant="warning">Mittel</Badge>;
  }
}

const WorldLocationRow = memo(function WorldLocationRow({
  location,
  isExpanded,
  onToggle,
  onDelete,
}: WorldLocationRowProps) {
  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(location.id, location.name);
    },
    [onDelete, location.id, location.name]
  );

  return (
    <React.Fragment>
      <tr
        className="hover:bg-surface-2/50 transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-3 py-4 text-center">
          <span className="text-text-muted text-sm">
            {isExpanded ? "▼" : "▶"}
          </span>
        </td>
        <td className="px-6 py-4">
          <p className="font-medium text-text-primary">{location.name}</p>
        </td>
        <td className="px-6 py-4 text-center">
          <span className="text-text-secondary">{location.countryCode || "—"}</span>
        </td>
        <td className="px-6 py-4 text-center">
          <span className="text-caption text-text-muted font-mono">
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </span>
        </td>
        <td className="px-6 py-4 text-center">
          {getDifficultyBadge(location.difficulty)}
        </td>
        <td className="px-6 py-4 text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-error hover:text-error hover:bg-error/10"
          >
            Löschen
          </Button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-surface-2/30">
          <td></td>
          <td colSpan={5} className="px-6 py-3">
            <div className="space-y-1 text-body-small">
              <p className="text-text-secondary">
                <span className="inline-block w-16">🇩🇪 DE:</span>
                <span className={location.nameDe ? "text-text-primary" : "text-text-muted"}>
                  {location.nameDe || "—"}
                </span>
              </p>
              <p className="text-text-secondary">
                <span className="inline-block w-16">🇬🇧 EN:</span>
                <span className={location.nameEn ? "text-text-primary" : "text-text-muted"}>
                  {location.nameEn || "—"}
                </span>
              </p>
              <p className="text-text-secondary">
                <span className="inline-block w-16">🇸🇮 SL:</span>
                <span className={location.nameSl ? "text-text-primary" : "text-text-muted"}>
                  {location.nameSl || "—"}
                </span>
              </p>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
});

export function WorldLocationTable({
  worldLocations,
  selectedCategory,
  translationStatus,
  translating,
  onDelete,
  onTranslate,
}: WorldLocationTableProps) {
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());

  const toggleExpanded = useCallback((locationId: string) => {
    setExpandedLocations((prev) => {
      const next = new Set(prev);
      if (next.has(locationId)) {
        next.delete(locationId);
      } else {
        next.add(locationId);
      }
      return next;
    });
  }, []);

  return (
    <Card variant="surface" padding="none" className="overflow-hidden">
      <div className="px-6 py-4 border-b border-glass-border flex items-center justify-between">
        <h3 className="text-h3 text-text-primary">
          Orte in &quot;{selectedCategory.name}&quot; ({worldLocations.length})
        </h3>
        <div className="flex items-center gap-3">
          {translationStatus && translationStatus.untranslatedCount > 0 && (
            <span className="text-sm text-text-secondary">
              {translationStatus.untranslatedCount} unübersetzt
            </span>
          )}
          {translationStatus && translationStatus.untranslatedCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onTranslate}
              isLoading={translating}
            >
              Übersetzen
            </Button>
          )}
          {translationStatus && translationStatus.untranslatedCount === 0 && translationStatus.totalCount > 0 && (
            <Badge variant="success">Alle übersetzt</Badge>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-2 border-b border-glass-border">
            <tr>
              <th className="w-8 px-3 py-3"></th>
              <th className="text-left px-6 py-3 text-caption font-medium text-text-secondary">Name</th>
              <th className="text-center px-6 py-3 text-caption font-medium text-text-secondary">Land</th>
              <th className="text-center px-6 py-3 text-caption font-medium text-text-secondary">Koordinaten</th>
              <th className="text-center px-6 py-3 text-caption font-medium text-text-secondary">Schwierigkeit</th>
              <th className="text-right px-6 py-3 text-caption font-medium text-text-secondary">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-glass-border">
            {worldLocations.map((location) => (
              <WorldLocationRow
                key={location.id}
                location={location}
                isExpanded={expandedLocations.has(location.id)}
                onToggle={() => toggleExpanded(location.id)}
                onDelete={onDelete}
              />
            ))}
            {worldLocations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-text-muted">
                  Keine Orte in dieser Kategorie
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
