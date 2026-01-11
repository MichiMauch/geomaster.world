"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { LoginCard } from "@/components/auth/LoginCard";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { LevelData, STREAK_MILESTONES, formatPoints } from "./sidebar-types";
import { StreakDisplay } from "./StreakDisplay";
import { LevelBadgeGrid, StreakBadgeGrid } from "./BadgeGrid";

interface UserSidebarProps {
  className?: string;
}

export function UserSidebar({ className }: UserSidebarProps) {
  const { data: session, status } = useSession();
  const locale = useLocale();
  const t = useTranslations("sidebar");
  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch level data when authenticated
  const fetchLevelData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/user/level", {
        headers: { "Accept-Language": locale },
      });
      if (response.ok) {
        const data = await response.json();
        setLevelData(data);
      } else {
        setError("loadingError");
        logger.error("Error fetching level data: API returned", response.status);
      }
    } catch (err) {
      setError("loadingError");
      logger.error("Error fetching level data", err);
    } finally {
      setIsLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchLevelData();
    }
  }, [status, fetchLevelData]);

  // Get highest achieved streak milestone for featured badge
  const achievedStreakMilestone = levelData
    ? STREAK_MILESTONES.filter(m => levelData.streak.longest >= m).pop()
    : null;

  if (status === "authenticated" && session?.user) {
    // Loading state
    if (isLoading && !levelData) {
      return (
        <Card variant="glass" className={cn("p-4 h-full backdrop-blur-md", className)}>
          <div className="animate-pulse">
            {/* Avatar and Badge skeleton */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center justify-center">
                <div className="w-20 h-20 rounded-xl bg-surface-2" />
              </div>
              <div className="flex items-center justify-center">
                <div className="w-20 h-20 rounded-xl bg-surface-2" />
              </div>
            </div>
            {/* Name skeleton */}
            <div className="h-8 bg-surface-2 rounded mb-4 mx-auto w-3/4" />
            {/* Progress bar skeleton */}
            <div className="h-3 bg-surface-2 rounded-full mb-4" />
            {/* Streak skeleton */}
            <div className="h-20 bg-surface-2 rounded-lg mb-4" />
          </div>
        </Card>
      );
    }

    // Error state
    if (error && !levelData) {
      return (
        <Card variant="glass" className={cn("p-4 h-full backdrop-blur-md", className)}>
          <div className="text-center py-8">
            <p className="text-error mb-4">{t(error)}</p>
            <button
              onClick={fetchLevelData}
              className="px-4 py-2 bg-surface-2 hover:bg-surface-3 rounded-lg text-sm text-text-primary transition-colors"
            >
              {t("retry")}
            </button>
          </div>
        </Card>
      );
    }

    return (
      <Card variant="glass" className={cn("p-4 h-full backdrop-blur-md", className)}>
        {/* Avatar and Badge - Two Column Layout */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Avatar Column */}
          <div className="flex items-center justify-center">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="w-20 h-20 rounded-xl border-2 border-success/50"
                style={{
                  boxShadow: "0 0 20px rgba(0, 255, 136, 0.5), 0 0 40px rgba(0, 255, 136, 0.2)",
                }}
              />
            ) : (
              <div
                className="w-20 h-20 rounded-xl bg-surface-2 flex items-center justify-center text-3xl font-bold text-success border-2 border-success/50"
                style={{
                  boxShadow: "0 0 20px rgba(0, 255, 136, 0.5), 0 0 40px rgba(0, 255, 136, 0.2)",
                }}
              >
                {(session.user.name || "U")[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* Badge Column */}
          <div className="flex items-center justify-center">
            {levelData && (
              <div
                className="relative w-20 h-20 border-2 border-success/50 rounded-xl overflow-hidden"
                style={{ boxShadow: "0 0 12px rgba(0, 255, 136, 0.4)" }}
              >
                <Image
                  src={`/images/badges/level${levelData.level}.webp`}
                  alt={`Level ${levelData.level}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            )}
          </div>
        </div>

        {/* Featured Streak Badge - only show if milestone >= 5 achieved */}
        {achievedStreakMilestone && (
          <div className="flex justify-center -mt-10 mb-2 relative z-10">
            <div
              className="relative w-14 h-14 rounded-xl border-2 border-warning/50 overflow-hidden"
              style={{ boxShadow: "0 0 12px rgba(255, 107, 53, 0.4)" }}
            >
              <Image
                src={`/images/badges/streak${achievedStreakMilestone}.webp`}
                alt={`${achievedStreakMilestone} Day Streak`}
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}

        {/* Large Username */}
        <h2 className="text-2xl font-heading font-bold text-text-primary mb-4 truncate text-center">
          {session.user.name}
        </h2>

        {/* Progress Bar with Glow */}
        {levelData && (
          <div className="mb-4">
            {/* Level name above progress bar */}
            <p className="text-sm text-success font-medium mb-2 text-center">
              {levelData.levelName} - Level {levelData.level}
            </p>

            {/* Progress bar with glow */}
            <div className="h-3 bg-surface-2 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-success to-success/80 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.round(levelData.progress * 100)}%`,
                  boxShadow: "0 0 10px rgba(0, 255, 136, 0.6), 0 0 20px rgba(0, 255, 136, 0.3)",
                }}
              />
            </div>

            {/* Points to next level */}
            <p className="text-xs text-text-muted mt-2 text-center">
              {!levelData.isMaxLevel && levelData.nextLevel && (
                <>
                  {formatPoints(levelData.pointsToNextLevel, locale)}{" "}
                  {t("pointsTo")}{" "}
                  {levelData.nextLevel.levelName}
                </>
              )}
              {levelData.isMaxLevel && (
                <span className="text-success">{t("maxLevelReached")}</span>
              )}
            </p>
          </div>
        )}

        {/* Streak Display */}
        {levelData && (
          <div className="mb-4">
            <StreakDisplay
              current={levelData.streak.current}
              lastPlayedDate={levelData.streak.lastPlayedDate}
            />
          </div>
        )}

        {/* All Level Badges */}
        {levelData && levelData.allLevels && (
          <div className="pt-4 border-t border-glass-border">
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
              {t("levelBadges")}
            </h3>
            <LevelBadgeGrid levels={levelData.allLevels} currentLevel={levelData.level} />
          </div>
        )}

        {/* Streak Badges */}
        {levelData && (
          <div className="pt-4 border-t border-glass-border">
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
              {t("streakBadges")}
            </h3>
            <StreakBadgeGrid milestones={STREAK_MILESTONES} currentStreak={levelData.streak.longest} />
          </div>
        )}
      </Card>
    );
  }

  return <LoginCard className={className} />;
}
