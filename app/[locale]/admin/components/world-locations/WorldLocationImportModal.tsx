"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { WorldQuizType } from "../../types";

interface WorldLocationImportModalProps {
  isOpen: boolean;
  fileName: string;
  fileData: unknown[] | null;
  selectedCategory: WorldQuizType | null;
  importing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function WorldLocationImportModal({
  isOpen,
  fileName,
  fileData,
  selectedCategory,
  importing,
  onConfirm,
  onCancel,
}: WorldLocationImportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <Card variant="elevated" padding="lg" className="w-full max-w-md mx-4">
        <h2 className="text-h3 text-text-primary mb-4">Import bestätigen</h2>
        <p className="text-text-secondary mb-4">
          Möchtest du <strong>{fileData?.length}</strong> Orte aus{" "}
          <strong>{fileName}</strong> in die Kategorie{" "}
          <strong>{selectedCategory?.name}</strong> importieren?
        </p>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={importing}
            className="flex-1"
          >
            Abbrechen
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            isLoading={importing}
            className="flex-1"
          >
            Importieren
          </Button>
        </div>
      </Card>
    </div>
  );
}
