"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { EXAMPLE_JSON } from "./constants";
import type { WorldQuizType } from "../../types";

interface WorldLocationImportFormProps {
  selectedCategory: WorldQuizType;
  onFileSelect: (data: unknown[], fileName: string) => void;
}

export function WorldLocationImportForm({ selectedCategory, onFileSelect }: WorldLocationImportFormProps) {
  const [importError, setImportError] = useState("");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        setImportError("Die Datei muss ein JSON-Array enthalten");
        return;
      }

      setImportError("");
      onFileSelect(data, file.name);
    } catch {
      setImportError("Ungültiges JSON-Format");
    }

    e.target.value = "";
  };

  return (
    <Card variant="surface" padding="lg">
      <h3 className="text-h3 text-text-primary mb-4">
        Orte zu &quot;{selectedCategory.name}&quot; importieren
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-body-small font-medium text-text-primary mb-2">
            JSON-Datei hochladen
          </label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="block w-full text-sm text-text-secondary
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-medium
              file:bg-primary file:text-white
              hover:file:bg-primary/90
              file:cursor-pointer"
          />
        </div>

        {importError && <p className="text-error text-body-small">{importError}</p>}

        <div className="bg-surface-2 rounded-lg p-4">
          <p className="text-body-small text-text-secondary mb-2">Beispiel JSON-Format:</p>
          <pre className="text-caption text-text-muted overflow-x-auto">
            {JSON.stringify(EXAMPLE_JSON, null, 2)}
          </pre>
        </div>
      </div>
    </Card>
  );
}
