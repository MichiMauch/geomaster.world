"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Lottie from "lottie-react";
import fireAnimation from "@/public/animations/fire.json";
import { STREAK_MILESTONES, MS_PER_DAY } from "./sidebar-types";

interface StreakDisplayProps {
  current: number;
  lastPlayedDate: string | null;
}

function calculateDisplayStreak(current: number, lastPlayedDate: string | null): number {
  const now = Date.now();
  const today = new Date(now).toISOString().split("T")[0];
  const yesterday = new Date(now - MS_PER_DAY).toISOString().split("T")[0];

  if (lastPlayedDate === today) {
    return current;
  } else if (lastPlayedDate === yesterday) {
    return current;
  } else if (lastPlayedDate) {
    return 1;
  }
  return 1;
}

export function StreakDisplay({ current, lastPlayedDate }: StreakDisplayProps) {
  const t = useTranslations("sidebar");
  const [displayStreak, setDisplayStreak] = useState(current || 1);

  // Calculate display streak after mount to avoid impure Date calls during render
  useEffect(() => {
    setDisplayStreak(calculateDisplayStreak(current, lastPlayedDate));
  }, [current, lastPlayedDate]);

  // Calculate progress to next milestone
  const currentMilestoneIndex = STREAK_MILESTONES.findIndex(m => m > displayStreak);
  const nextMilestone = currentMilestoneIndex >= 0 ? STREAK_MILESTONES[currentMilestoneIndex] : null;
  const prevMilestone = currentMilestoneIndex > 0 ? STREAK_MILESTONES[currentMilestoneIndex - 1] : 0;

  let streakProgress = 1; // Default to 100% if max reached
  if (nextMilestone) {
    streakProgress = (displayStreak - prevMilestone) / (nextMilestone - prevMilestone);
  }

  return (
    <div>
      {/* Current streak display with progress bar */}
      <div className="bg-surface-2/50 rounded-lg px-3 py-2 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 -ml-1">
            <Lottie animationData={fireAnimation} loop={true} />
          </div>
          <div>
            <span className="text-lg font-bold text-warning">{displayStreak}</span>
            <span className="text-xs text-text-muted ml-1">
              {t("dayStreak")}
            </span>
          </div>
        </div>

        {/* Progress bar to next milestone */}
        <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-warning to-warning/80 rounded-full transition-all duration-500"
            style={{
              width: `${Math.round(streakProgress * 100)}%`,
              boxShadow: "0 0 8px rgba(255, 107, 53, 0.5)",
            }}
          />
        </div>

        {/* Next milestone info */}
        {nextMilestone && (
          <p className="text-xs text-text-muted mt-1 text-center">
            {nextMilestone - displayStreak} {t("daysTo")} {nextMilestone}
          </p>
        )}
        {!nextMilestone && (
          <p className="text-xs text-warning mt-1 text-center">
            {t("allStreakGoalsReached")}
          </p>
        )}
      </div>
    </div>
  );
}
