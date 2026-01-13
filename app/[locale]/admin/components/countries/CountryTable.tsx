"use client";

import { memo } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { GeoJSONPreview } from "./GeoJSONPreview";
import type { Country } from "../../types";

interface CountryRowProps {
  country: Country;
  onEdit: (country: Country) => void;
  onDelete: (countryId: string, countryName: string) => void;
  onToggleActive: (country: Country) => void;
}

const CountryRow = memo(function CountryRow({
  country,
  onEdit,
  onDelete,
  onToggleActive,
}: CountryRowProps) {
  return (
    <tr className="hover:bg-surface-2/50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-14 flex-shrink-0">
            <GeoJSONPreview countryId={country.id} height="56px" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{country.icon}</span>
            <div>
              <p className="font-medium text-text-primary">{country.name}</p>
              <p className="text-caption text-text-muted">{country.id}</p>
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <Badge variant="default">{country.locationCount}</Badge>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="text-caption text-text-muted">
          <span title="Timeout-Strafe">⏱️ {country.timeoutPenalty}km</span>
          <span className="mx-2">|</span>
          <span title="Score-Faktor">📊 {country.scoreScaleFactor}km</span>
          <span className="mx-2">|</span>
          <span title="Zoom">🔍 {country.defaultZoom}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <ToggleSwitch
          checked={country.isActive}
          onChange={() => onToggleActive(country)}
          size="md"
        />
      </td>
      <td className="px-6 py-4 text-right space-x-2">
        <Button variant="ghost" size="sm" onClick={() => onEdit(country)}>
          Bearbeiten
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(country.id, country.name)}
          className="text-error hover:text-error hover:bg-error/10"
        >
          Löschen
        </Button>
      </td>
    </tr>
  );
});

interface CountryTableProps {
  countries: Country[];
  onEdit: (country: Country) => void;
  onDelete: (countryId: string, countryName: string) => void;
  onToggleActive: (country: Country) => void;
}

export function CountryTable({
  countries,
  onEdit,
  onDelete,
  onToggleActive,
}: CountryTableProps) {
  return (
    <Card variant="surface" padding="none" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-2 border-b border-glass-border">
            <tr>
              <th className="text-left px-6 py-3 text-caption font-medium text-text-secondary">
                Land
              </th>
              <th className="text-center px-6 py-3 text-caption font-medium text-text-secondary">
                Orte
              </th>
              <th className="text-center px-6 py-3 text-caption font-medium text-text-secondary">
                Einstellungen
              </th>
              <th className="text-center px-6 py-3 text-caption font-medium text-text-secondary">
                Status
              </th>
              <th className="text-right px-6 py-3 text-caption font-medium text-text-secondary">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-glass-border">
            {countries.map((country) => (
              <CountryRow
                key={country.id}
                country={country}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleActive={onToggleActive}
              />
            ))}
            {countries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                  Keine Länder vorhanden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
