"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

interface RoundHeaderProps {
  /** Back link URL */
  backHref: string;
  /** Round info text (e.g., "Round 2 · Location 3/5") */
  roundInfo: string;
  /** Location name to guess */
  locationName: string;
  /** Total distance so far (optional) */
  totalDistance?: number;
  /** Time limit in seconds (optional, null = no limit) */
  timeLimit?: number | null;
  /** Callback when time runs out */
  onTimeUp?: () => void;
  /** Whether the timer is running */
  timerActive?: boolean;
  /** Back button text */
  backText?: string;
}

export function RoundHeader({
  backHref,
  roundInfo,
  locationName,
  totalDistance,
  timeLimit,
  onTimeUp,
  timerActive = true,
  backText = "←",
}: RoundHeaderProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit || 0);
  const hasTimeLimit = timeLimit !== null && timeLimit !== undefined && timeLimit > 0;

  useEffect(() => {
    if (!hasTimeLimit || !timerActive) return;

    setTimeLeft(timeLimit!);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLimit, timerActive, onTimeUp, hasTimeLimit]);

  const isWarning = hasTimeLimit && timeLeft <= 10;

  return (
    <div className="bg-surface-1 border-b border-glass-border p-4 shadow-sm">
      {/* Top Row */}
      <div className="flex items-center justify-between mb-3">
        <Link
          href={backHref}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <span className="text-lg">{backText}</span>
        </Link>

        <span className="text-caption text-text-secondary">{roundInfo}</span>

        {hasTimeLimit && (
          <div
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-sm",
              isWarning
                ? "bg-error/20 text-error animate-timer-warning"
                : "bg-surface-3 text-text-secondary"
            )}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{timeLeft}s</span>
          </div>
        )}
      </div>

      {/* Location Name */}
      <div className="text-center">
        <p className="text-caption text-text-muted mb-1">Wo liegt...</p>
        <h2 className="text-h2 text-text-primary">{locationName}</h2>
      </div>

      {/* Total Distance (if provided) */}
      {totalDistance !== undefined && (
        <div className="text-center mt-3">
          <span className="text-body-small text-accent">
            Bisher: {totalDistance.toFixed(0)} km
          </span>
        </div>
      )}
    </div>
  );
}

// Compact version for smaller screens
export function RoundHeaderCompact({
  roundInfo,
  locationName,
  timeLeft,
}: {
  roundInfo: string;
  locationName: string;
  timeLeft?: number;
}) {
  const isWarning = timeLeft !== undefined && timeLeft <= 10;

  return (
    <div className="bg-surface-1 border border-glass-border rounded-xl p-3 flex items-center justify-between gap-4 shadow-sm">
      <div className="flex-1 min-w-0">
        <p className="text-caption text-text-muted truncate">{roundInfo}</p>
        <p className="text-body font-semibold text-text-primary truncate">
          {locationName}
        </p>
      </div>
      {timeLeft !== undefined && (
        <div
          className={cn(
            "shrink-0 px-3 py-1.5 rounded-lg font-mono text-sm font-medium",
            isWarning
              ? "bg-error/20 text-error animate-timer-warning"
              : "bg-surface-3 text-text-secondary"
          )}
        >
          {timeLeft}s
        </div>
      )}
    </div>
  );
}
