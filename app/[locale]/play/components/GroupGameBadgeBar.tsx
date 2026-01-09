"use client";

import { memo } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { formatDistance } from "@/lib/distance";
import { useTranslations } from "next-intl";
import type { GameRound, GuessResult, TimerState } from "../types";

interface GroupGameBadgeBarProps {
  currentRound: GameRound;
  showResult: boolean;
  timeExpired: boolean;
  timerState: TimerState;
  timeRemaining: number | null;
  currentTimeLimit: number | null;
  lastResult: GuessResult | null;
  buttonConfig: {
    text: string;
    variant: "success" | "primary" | "accent";
    onClick: () => void;
    disabled: boolean;
  };
  submitting: boolean;
}

export const GroupGameBadgeBar = memo(function GroupGameBadgeBar({
  currentRound,
  showResult,
  timeExpired,
  timerState,
  timeRemaining,
  currentTimeLimit,
  lastResult,
  buttonConfig,
  submitting,
}: GroupGameBadgeBarProps) {
  const t = useTranslations("play");

  return (
    <div className={cn(
      "absolute top-4 left-1/2 -translate-x-1/2 z-[500]",
      "bg-background/85 backdrop-blur-md rounded-lg",
      "flex items-center gap-3 px-4 py-2",
      "border-2",
      // Border color based on state
      !showResult && !timeExpired && timerState === "normal" && "border-primary",
      !showResult && !timeExpired && timerState === "warning" && "border-accent",
      !showResult && !timeExpired && timerState === "critical" && "border-error",
      timeExpired && !showResult && "border-error timer-expired",
      showResult && lastResult && lastResult.distanceKm < 20 && "border-success",
      showResult && lastResult && lastResult.distanceKm >= 20 && lastResult.distanceKm < 100 && "border-accent",
      showResult && lastResult && lastResult.distanceKm >= 100 && "border-glass-border",
      // Animations
      !showResult && !timeExpired && timerState === "warning" && "animate-timer-warning",
      !showResult && !timeExpired && timerState === "critical" && "animate-timer-critical"
    )}>
      {/* Location */}
      <div className="flex items-baseline gap-1">
        <span className="text-[10px] text-text-muted uppercase tracking-widest">
          {t("whereIs")}
        </span>
        <span className="text-lg font-bold text-text-primary text-glow-primary">
          {currentRound.locationName}
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-glass-border" />

      {/* Timer / Result / Timeout Display */}
      <span className={cn(
        "font-mono font-bold text-lg tabular-nums min-w-[50px] text-center",
        // Timer colors
        !showResult && !timeExpired && timerState === "normal" && "text-primary",
        !showResult && !timeExpired && timerState === "warning" && "text-accent",
        !showResult && !timeExpired && timerState === "critical" && "text-error",
        // Timeout
        timeExpired && !showResult && "text-error",
        // Result colors
        showResult && lastResult && lastResult.distanceKm < 20 && "text-success",
        showResult && lastResult && lastResult.distanceKm >= 20 && lastResult.distanceKm < 100 && "text-accent",
        showResult && lastResult && lastResult.distanceKm >= 100 && "text-text-primary"
      )}>
        {!showResult && !timeExpired && currentTimeLimit && (
          <>{timeRemaining !== null ? timeRemaining.toFixed(1) : currentTimeLimit.toFixed(1)}s</>
        )}
        {!showResult && !timeExpired && !currentTimeLimit && "—"}
        {timeExpired && !showResult && t("timeUp")}
        {showResult && lastResult && <>{formatDistance(lastResult.distanceKm, currentRound?.gameType)}</>}
      </span>

      {/* Divider */}
      <div className="w-px h-6 bg-glass-border" />

      {/* Action Button */}
      <Button
        variant={buttonConfig.variant}
        size="sm"
        onClick={buttonConfig.onClick}
        disabled={buttonConfig.disabled}
        isLoading={submitting}
        className="whitespace-nowrap"
      >
        {submitting ? "..." : buttonConfig.text}
      </Button>
    </div>
  );
});
