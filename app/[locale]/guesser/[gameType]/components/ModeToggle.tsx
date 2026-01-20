"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { User, Swords } from "lucide-react";

export type GameMode = "solo" | "duel";

interface ModeToggleProps {
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
  locale: string;
  disabled?: boolean;
  isLoggedIn?: boolean;
}

const labels: Record<string, { solo: string; duel: string; loginRequired: string }> = {
  de: {
    solo: "Solo-Abenteuer",
    duel: "1:1 Duell",
    loginRequired: "Login erforderlich",
  },
  en: {
    solo: "Solo Adventure",
    duel: "1:1 Duel",
    loginRequired: "Login required",
  },
  sl: {
    solo: "Solo pustolovščina",
    duel: "1:1 Dvoboj",
    loginRequired: "Prijava potrebna",
  },
};

export const ModeToggle = memo(function ModeToggle({
  mode,
  onModeChange,
  locale,
  disabled = false,
  isLoggedIn = false,
}: ModeToggleProps) {
  const t = labels[locale] || labels.de;

  const handleModeChange = (newMode: GameMode) => {
    if (disabled) return;
    if (newMode === "duel" && !isLoggedIn) return;
    onModeChange(newMode);
  };

  return (
    <div className="w-full flex rounded-lg overflow-hidden border border-glass-border bg-surface-1/50 backdrop-blur-sm">
      {/* Solo Button */}
      <button
        onClick={() => handleModeChange("solo")}
        disabled={disabled}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-all duration-200",
          mode === "solo"
            ? "bg-primary/20 text-primary border-2 border-primary shadow-[inset_0_0_20px_rgba(0,217,255,0.2)]"
            : "text-text-muted hover:text-text-secondary hover:bg-surface-1/50 border-r border-glass-border"
        )}
      >
        <User className="w-4 h-4" />
        {t.solo}
      </button>

      {/* Duel Button */}
      <button
        onClick={() => handleModeChange("duel")}
        disabled={disabled || !isLoggedIn}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-all duration-200 relative",
          mode === "duel"
            ? "bg-accent/20 text-accent border-2 border-accent shadow-[inset_0_0_20px_rgba(255,107,53,0.2)]"
            : "text-text-muted hover:text-text-secondary hover:bg-surface-1/50",
          !isLoggedIn && "opacity-50 cursor-not-allowed"
        )}
        title={!isLoggedIn ? t.loginRequired : undefined}
      >
        <Swords className="w-4 h-4" />
        {t.duel}
      </button>
    </div>
  );
});
