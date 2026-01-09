"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Country } from "../../types";

interface ImportModalProps {
  isOpen: boolean;
  fileName: string;
  fileData: unknown[] | null;
  selectedCountry: Country | null;
  importing: boolean;
  importError: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ImportModal({
  isOpen,
  fileName,
  fileData,
  selectedCountry,
  importing,
  importError,
  onConfirm,
  onCancel,
}: ImportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <Card variant="elevated" padding="lg" className="w-full max-w-md mx-4">
        <h2 className="text-h3 text-text-primary mb-4">Orte importieren</h2>
        <p className="text-body-small text-text-secondary mb-2">
          Datei: <span className="font-mono text-primary">{fileName}</span>
        </p>
        <p className="text-body-small text-text-secondary mb-2">
          {fileData?.length} Orte gefunden
        </p>
        <p className="text-body-small text-text-secondary mb-4">
          Land: <span className="font-medium">{selectedCountry?.icon} {selectedCountry?.name}</span>
        </p>

        {importError && (
          <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg">
            <p className="text-error text-body-small whitespace-pre-line">{importError}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="ghost"
            size="md"
            onClick={onCancel}
            disabled={importing}
            className="flex-1"
          >
            Abbrechen
          </Button>
          <Button
            variant="primary"
            size="md"
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
