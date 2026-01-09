"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

interface RoundTabsProps {
  maxRoundNumber: number;
  selectedRound: number | null;
  onSelectRound: (round: number | null) => void;
  labels: {
    total: string;
    round: string;
  };
}

export const RoundTabs = memo(function RoundTabs({
  maxRoundNumber,
  selectedRound,
  onSelectRound,
  labels,
}: RoundTabsProps) {
  if (maxRoundNumber <= 0) return null;

  return (
    <div className="mb-4 overflow-x-auto -mx-2 px-2">
      <div className="flex gap-1 min-w-max">
        <button
          onClick={() => onSelectRound(null)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
            selectedRound === null
              ? "bg-accent text-white shadow-sm"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
          )}
        >
          {labels.total}
        </button>
        {Array.from({ length: maxRoundNumber }, (_, i) => i + 1).map((round) => (
          <button
            key={round}
            onClick={() => onSelectRound(round)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              selectedRound === round
                ? "bg-accent text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
            )}
          >
            {labels.round} {round}
          </button>
        ))}
      </div>
    </div>
  );
});
