"use client";

import { useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Location, Country } from "../../types";

interface LocationListProps {
  locations: Location[];
  selectedCountry: Country | null;
  onDelete: (locationId: string, locationName: string) => void;
}

interface LocationRowProps {
  location: Location;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: (locationId: string, locationName: string) => void;
}

const LocationRow = memo(function LocationRow({ location, isExpanded, onToggle, onDelete }: LocationRowProps) {
  return (
    <div className="rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors">
      {/* Main row - clickable to expand */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {/* Expand/Collapse indicator */}
          <span className="text-text-muted text-sm w-4">
            {isExpanded ? "▼" : "▶"}
          </span>
          <div>
            <p className="font-medium text-text-primary">{location.name}</p>
            <p className="text-caption text-text-muted">
              {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </p>
          </div>
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
          onClick={(e) => {
            e.stopPropagation();
            onDelete(location.id, location.name);
          }}
          className="text-error hover:text-error hover:bg-error/10"
        >
          Löschen
        </Button>
      </div>

      {/* Expanded translation details */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 ml-7 border-t border-glass-border">
          <div className="pt-3 space-y-1 text-body-small">
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
        </div>
      )}
    </div>
  );
});

export function LocationList({ locations, selectedCountry, onDelete }: LocationListProps) {
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
    <Card variant="surface" padding="lg">
      <h2 className="text-h3 text-text-primary mb-4">
        Vorhandene Orte ({locations.length})
      </h2>

      {locations.length === 0 ? (
        <p className="text-text-muted text-center py-8">
          {selectedCountry
            ? `Noch keine Orte für ${selectedCountry.name} vorhanden.`
            : "Wähle ein Land aus."}
        </p>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {locations.map((location) => (
            <LocationRow
              key={location.id}
              location={location}
              isExpanded={expandedLocations.has(location.id)}
              onToggle={() => toggleExpanded(location.id)}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
