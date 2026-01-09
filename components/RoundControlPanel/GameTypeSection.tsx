"use client";

import { memo } from "react";
import { getGameTypeName } from "@/lib/game-types";
import { OptionButton } from "./OptionButton";
import type { GameTypeInfo } from "./types";

interface GameTypeSectionProps {
  label: string;
  gameTypes: GameTypeInfo[];
  selectedGameType: string;
  onSelect: (id: string) => void;
  locale: string;
  layout?: "flex" | "grid";
}

export const GameTypeSection = memo(function GameTypeSection({
  label,
  gameTypes,
  selectedGameType,
  onSelect,
  locale,
  layout = "flex",
}: GameTypeSectionProps) {
  if (gameTypes.length === 0) return null;

  return (
    <div className="space-y-1">
      <span className="text-xs text-text-muted">{label}</span>
      <div className={layout === "grid" ? "grid grid-cols-1 sm:grid-cols-3 gap-2" : "flex gap-2"}>
        {gameTypes.map((gameType) => (
          <OptionButton
            key={gameType.id}
            selected={selectedGameType === gameType.id}
            onClick={() => onSelect(gameType.id)}
            className={layout === "flex" ? "flex-1 flex items-center justify-center gap-1" : "flex items-center justify-center gap-1"}
          >
            <span>{gameType.icon}</span>
            <span>{getGameTypeName(gameType.id, locale)}</span>
          </OptionButton>
        ))}
      </div>
    </div>
  );
});
