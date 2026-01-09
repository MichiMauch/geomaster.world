"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { EXAMPLE_JSON } from "./constants";
import type { Country } from "../../types";

interface LocationImportFormProps {
  selectedCountry: Country | null;
  onFileSelect: (data: unknown[], fileName: string) => void;
}

export function LocationImportForm({ selectedCountry, onFileSelect }: LocationImportFormProps) {
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
      setImportError("Fehler beim Lesen der Datei");
    } finally {
      e.target.value = "";
    }
  };

  const downloadExampleJson = () => {
    const blob = new Blob([JSON.stringify(EXAMPLE_JSON, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "locations-example.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card variant="surface" padding="lg">
      <h2 className="text-h3 text-text-primary mb-6">Orte via JSON importieren</h2>

      <div className="flex flex-wrap gap-4 mb-6">
        <label className="relative inline-block cursor-pointer">
          <span
            className={cn(
              "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg",
              "font-semibold transition-all duration-200 ease-out h-12 px-4 text-sm",
              "bg-primary text-white",
              "hover:bg-primary/90"
            )}
          >
            JSON-Datei auswählen
          </span>
          <input
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={!selectedCountry}
          />
        </label>

        <Button variant="secondary" size="lg" onClick={downloadExampleJson}>
          Beispiel-JSON
        </Button>
      </div>

      {importError && (
        <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg">
          <p className="text-error text-body-small whitespace-pre-line">{importError}</p>
        </div>
      )}

      <div className="p-4 bg-surface-2 rounded-lg">
        <h3 className="font-medium text-text-primary mb-2">JSON-Format:</h3>
        <pre className="text-caption text-text-muted overflow-x-auto">
{`[
  {
    "name": "Ortsname",
    "latitude": 47.3769,
    "longitude": 8.5417,
    "difficulty": "easy" | "medium" | "hard"
  }
]`}
        </pre>
      </div>
    </Card>
  );
}
