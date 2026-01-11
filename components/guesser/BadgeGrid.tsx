"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { LevelInfo, formatPoints, getTooltipPosition, getArrowPosition } from "./sidebar-types";

interface BadgeTooltipProps {
  isVisible: boolean;
  index: number;
  id?: string;
  children: React.ReactNode;
}

function BadgeTooltip({ isVisible, index, id, children }: BadgeTooltipProps) {
  if (!isVisible) return null;

  return (
    <div
      id={id}
      role="tooltip"
      className={cn("absolute bottom-full mb-3 z-50 pointer-events-none", getTooltipPosition(index))}
    >
      <div className="bg-surface-2 border border-glass-border rounded-xl p-4 shadow-xl flex flex-col items-center gap-2">
        {children}
      </div>
      <div className={cn("absolute -bottom-2 w-4 h-4 bg-surface-2 border-r border-b border-glass-border rotate-45", getArrowPosition(index))} />
    </div>
  );
}

// ============================================================================
// Level Badge Grid
// ============================================================================

interface LevelBadgeGridProps {
  levels: LevelInfo[];
  currentLevel: number;
}

export function LevelBadgeGrid({ levels, currentLevel }: LevelBadgeGridProps) {
  const t = useTranslations("sidebar");
  const locale = useLocale();
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const showTooltip = (level: number, index: number) => {
    setHoveredLevel(level);
    setHoveredIndex(index);
  };

  const hideTooltip = () => {
    setHoveredLevel(null);
    setHoveredIndex(null);
  };

  return (
    <div className="grid grid-cols-3 gap-3" role="list" aria-label={t("levelBadges")}>
      {levels.map((lvl, index) => {
        const tooltipId = `tooltip-level-${lvl.level}`;
        const isTooltipVisible = hoveredLevel === lvl.level && hoveredIndex === index;

        return (
          <div
            key={lvl.level}
            className="relative outline-none focus-visible:ring-2 focus-visible:ring-success rounded-lg"
            role="listitem"
            tabIndex={0}
            aria-label={`Level ${lvl.level}: ${lvl.name}, ${formatPoints(lvl.minPoints, locale)} ${t("points")}${lvl.achieved ? ` - ${t("achieved")}` : ""}`}
            aria-describedby={isTooltipVisible ? tooltipId : undefined}
            onMouseEnter={() => showTooltip(lvl.level, index)}
            onMouseLeave={hideTooltip}
            onFocus={() => showTooltip(lvl.level, index)}
            onBlur={hideTooltip}
          >
            <div
              className={cn(
                "relative aspect-square rounded-lg border-2 overflow-hidden transition-all duration-200 cursor-pointer",
                lvl.achieved
                  ? "border-success/50 shadow-[0_0_8px_rgba(0,255,136,0.3)] hover:scale-110 hover:z-10"
                  : "border-glass-border opacity-40 grayscale hover:opacity-60"
              )}
            >
              <Image
                src={`/images/badges/level${lvl.level}.webp`}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
              />
              {lvl.level === currentLevel && (
                <div className="absolute inset-0 border-2 border-success rounded-lg animate-pulse" />
              )}
            </div>

            <BadgeTooltip isVisible={isTooltipVisible} index={index} id={tooltipId}>
            <div
              className={cn(
                "relative w-24 h-24 rounded-xl overflow-hidden border-2 flex-shrink-0",
                lvl.achieved ? "border-success/50" : "border-glass-border"
              )}
              style={lvl.achieved ? { boxShadow: "0 0 16px rgba(0, 255, 136, 0.4)" } : {}}
            >
              <Image
                src={`/images/badges/level${lvl.level}.webp`}
                alt={`Level ${lvl.level}`}
                fill
                className={cn("object-cover", !lvl.achieved && "grayscale opacity-50")}
                sizes="96px"
              />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-text-primary">Level {lvl.level}</p>
              <p className="text-sm text-success font-medium">{lvl.name}</p>
              <p className="text-xs text-text-muted">{formatPoints(lvl.minPoints, locale)} {t("points")}</p>
            </div>
          </BadgeTooltip>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Streak Badge Grid
// ============================================================================

interface StreakBadgeGridProps {
  milestones: number[];
  currentStreak: number;
}

export function StreakBadgeGrid({ milestones, currentStreak }: StreakBadgeGridProps) {
  const t = useTranslations("sidebar");
  const [hoveredMilestone, setHoveredMilestone] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const showTooltip = (milestone: number, index: number) => {
    setHoveredMilestone(milestone);
    setHoveredIndex(index);
  };

  const hideTooltip = () => {
    setHoveredMilestone(null);
    setHoveredIndex(null);
  };

  return (
    <div className="grid grid-cols-3 gap-2" role="list" aria-label={t("streakBadges")}>
      {milestones.map((milestone, index) => {
        const tooltipId = `tooltip-streak-${milestone}`;
        const isTooltipVisible = hoveredMilestone === milestone && hoveredIndex === index;
        const isAchieved = currentStreak >= milestone;

        return (
          <div
            key={milestone}
            className="relative outline-none focus-visible:ring-2 focus-visible:ring-warning rounded-lg"
            role="listitem"
            tabIndex={0}
            aria-label={`${milestone} ${t("days")} ${t("streakBadge")}${isAchieved ? ` - ${t("achieved")}` : ` - ${milestone - currentStreak} ${t("daysLeft")}`}`}
            aria-describedby={isTooltipVisible ? tooltipId : undefined}
            onMouseEnter={() => showTooltip(milestone, index)}
            onMouseLeave={hideTooltip}
            onFocus={() => showTooltip(milestone, index)}
            onBlur={hideTooltip}
          >
            <div
              className={cn(
                "relative aspect-square rounded-lg border-2 overflow-hidden transition-all duration-200 cursor-pointer",
                isAchieved
                  ? "border-warning/50 shadow-[0_0_8px_rgba(255,107,53,0.3)] hover:scale-110 hover:z-10"
                  : "border-glass-border opacity-40 grayscale hover:opacity-60"
              )}
            >
              <Image
                src={`/images/badges/streak${milestone}.webp`}
                alt=""
                fill
                className="object-cover"
                sizes="60px"
              />
            </div>

            <BadgeTooltip isVisible={isTooltipVisible} index={index} id={tooltipId}>
              <div
                className={cn(
                  "relative w-24 h-24 rounded-xl overflow-hidden border-2 flex-shrink-0",
                  isAchieved ? "border-warning/50" : "border-glass-border"
                )}
                style={isAchieved ? { boxShadow: "0 0 16px rgba(255, 107, 53, 0.4)" } : {}}
              >
                <Image
                  src={`/images/badges/streak${milestone}.webp`}
                  alt=""
                  fill
                  className={cn("object-cover", !isAchieved && "grayscale opacity-50")}
                  sizes="96px"
                />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-text-primary">{milestone} {t("days")}</p>
                <p className="text-sm text-warning font-medium">{t("streakBadge")}</p>
                {!isAchieved && (
                  <p className="text-xs text-text-muted">{milestone - currentStreak} {t("daysLeft")}</p>
                )}
                {isAchieved && (
                  <p className="text-xs text-warning">{t("achieved")}</p>
                )}
              </div>
            </BadgeTooltip>
          </div>
        );
      })}
    </div>
  );
}
