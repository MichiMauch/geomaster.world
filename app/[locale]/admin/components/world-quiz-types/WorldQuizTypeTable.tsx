"use client";

import { memo, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import type { WorldQuizType } from "../../types";

interface WorldQuizTypeTableProps {
  worldQuizTypes: WorldQuizType[];
  onEdit: (quizType: WorldQuizType) => void;
  onDelete: (quizTypeId: string, quizTypeName: string) => void;
  onToggleActive: (quizType: WorldQuizType) => void;
}

interface WorldQuizTypeRowProps {
  quizType: WorldQuizType;
  onEdit: (quizType: WorldQuizType) => void;
  onDelete: (quizTypeId: string, quizTypeName: string) => void;
  onToggleActive: (quizType: WorldQuizType) => void;
}

const WorldQuizTypeRow = memo(function WorldQuizTypeRow({
  quizType,
  onEdit,
  onDelete,
  onToggleActive,
}: WorldQuizTypeRowProps) {
  const handleEdit = useCallback(() => onEdit(quizType), [onEdit, quizType]);
  const handleDelete = useCallback(
    () => onDelete(quizType.id, quizType.name),
    [onDelete, quizType.id, quizType.name]
  );
  const handleToggle = useCallback(() => onToggleActive(quizType), [onToggleActive, quizType]);

  return (
    <tr className="hover:bg-surface-2/50 transition-colors">
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
          onChange={handleToggle}
          size="md"
        />
      </td>
      <td className="px-6 py-4 text-right space-x-2">
        <Button variant="ghost" size="sm" onClick={handleEdit}>
          Bearbeiten
        </Button>
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
  );
});

export function WorldQuizTypeTable({
  worldQuizTypes,
  onEdit,
  onDelete,
  onToggleActive,
}: WorldQuizTypeTableProps) {
  return (
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
              <WorldQuizTypeRow
                key={quizType.id}
                quizType={quizType}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleActive={onToggleActive}
              />
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
  );
}
