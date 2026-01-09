"use client";

import { Button } from "@/components/ui/Button";

interface StartButtonProps {
  onClick: () => void;
  disabled: boolean;
  locale: string;
}

export function StartButton({ onClick, disabled, locale }: StartButtonProps) {
  const labels: Record<string, { creating: string; start: string }> = {
    de: { creating: "Erstelle Spiel...", start: "Spiel starten" },
    en: { creating: "Creating game...", start: "Start Game" },
    sl: { creating: "Ustvarjam igro...", start: "Začni igro" },
  };

  const label = labels[locale] || labels.de;

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      size="lg"
      variant="primary"
      className="w-full"
    >
      {disabled ? label.creating : label.start}
    </Button>
  );
}
