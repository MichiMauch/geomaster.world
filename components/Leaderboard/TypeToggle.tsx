"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import type { LeaderboardType } from "./types";

interface TypeToggleProps {
  type: LeaderboardType;
  onChange: (type: LeaderboardType) => void;
  labels: {
    weekly: string;
    alltime: string;
  };
}

export const TypeToggle = memo(function TypeToggle({ type, onChange, labels }: TypeToggleProps) {
  return (
    <div className="flex gap-1 p-1 rounded-lg bg-surface-2 border border-glass-border">
      <button
        onClick={() => onChange("weekly")}
        className={cn(
          "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
          type === "weekly"
            ? "bg-primary text-white shadow-sm"
            : "text-text-secondary hover:text-text-primary hover:bg-surface-3"
        )}
      >
        {labels.weekly}
      </button>
      <button
        onClick={() => onChange("alltime")}
        className={cn(
          "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
          type === "alltime"
            ? "bg-primary text-white shadow-sm"
            : "text-text-secondary hover:text-text-primary hover:bg-surface-3"
        )}
      >
        {labels.alltime}
      </button>
    </div>
  );
});
