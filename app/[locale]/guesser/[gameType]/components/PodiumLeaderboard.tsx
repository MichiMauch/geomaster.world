"use client";

import { memo } from "react";
import Link from "next/link";
import type { RankingEntry } from "../types";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import type { DuelRankingEntry } from "../hooks/useDuelRankings";

export type LeaderboardVariant = "solo" | "duel";

interface PodiumLeaderboardProps {
  rankings: RankingEntry[] | DuelRankingEntry[];
  loading: boolean;
  locale: string;
  gameType?: string;
  showPodium?: boolean;
  showList?: boolean;
  showLeaderboardLink?: boolean;
  variant?: LeaderboardVariant;
}

// Labels for duel leaderboard
const duelLabels: Record<string, { title: string; points: string }> = {
  de: { title: "Duell-Champions", points: "Punkte" },
  en: { title: "Duel Champions", points: "Points" },
  sl: { title: "Dvobojevalni prvaki", points: "Točke" },
};

export const PodiumLeaderboard = memo(function PodiumLeaderboard({
  rankings,
  loading,
  locale,
  gameType,
  showPodium = true,
  showList = true,
  showLeaderboardLink = false,
  variant = "solo",
}: PodiumLeaderboardProps) {
  const isDuel = variant === "duel";
  const duelLabel = duelLabels[locale] || duelLabels.de;

  // Helper to get display value (bestScore for solo, duelPoints for duel)
  const getDisplayValue = (entry: RankingEntry | DuelRankingEntry): number => {
    if (isDuel && "duelPoints" in entry) {
      return entry.duelPoints;
    }
    return (entry as RankingEntry).bestScore || 0;
  };

  // Fill with empty entries if less than 3
  const top3 = [...rankings.slice(0, 3)];
  while (top3.length < 3) {
    if (isDuel) {
      top3.push({ rank: top3.length + 1, userName: null, userImage: null, wins: 0, losses: 0, totalDuels: 0, winRate: 0, duelPoints: 0, userId: "" } as DuelRankingEntry);
    } else {
      top3.push({ rank: top3.length + 1, userName: null, bestScore: 0 } as RankingEntry);
    }
  }

  // Podium order: 2nd, 1st, 3rd (for visual display)
  const podiumOrder = [top3[1], top3[0], top3[2]];
  const heights = ["h-32", "h-40", "h-28"];
  const positions = [2, 1, 3];

  // Podium styles - duel variant uses orange theme
  const podiumStyles = isDuel
    ? [
        // Silver (2nd place) - orange tinted
        {
          bg: "bg-orange-400/15",
          border: "border-orange-300/60",
          glow: "shadow-[0_0_15px_rgba(255,150,100,0.4),inset_0_0_10px_rgba(255,150,100,0.1)]",
          numberColor: "text-orange-300",
        },
        // Gold (1st place) - orange
        {
          bg: "bg-accent/20",
          border: "border-accent/70",
          glow: "shadow-[0_0_20px_rgba(255,107,53,0.5),inset_0_0_15px_rgba(255,107,53,0.15)]",
          numberColor: "text-accent",
        },
        // Bronze (3rd place) - orange tinted
        {
          bg: "bg-orange-600/15",
          border: "border-orange-500/60",
          glow: "shadow-[0_0_15px_rgba(255,130,50,0.4),inset_0_0_10px_rgba(255,130,50,0.1)]",
          numberColor: "text-orange-400",
        },
      ]
    : [
        // Silver (2nd place)
        {
          bg: "bg-gray-400/15",
          border: "border-gray-300/60",
          glow: "shadow-[0_0_15px_rgba(192,192,192,0.4),inset_0_0_10px_rgba(192,192,192,0.1)]",
          numberColor: "text-gray-300",
        },
        // Gold (1st place)
        {
          bg: "bg-yellow-500/20",
          border: "border-yellow-400/70",
          glow: "shadow-[0_0_20px_rgba(255,215,0,0.5),inset_0_0_15px_rgba(255,215,0,0.15)]",
          numberColor: "text-yellow-400",
        },
        // Bronze (3rd place)
        {
          bg: "bg-amber-600/15",
          border: "border-amber-500/60",
          glow: "shadow-[0_0_15px_rgba(205,127,50,0.4),inset_0_0_10px_rgba(205,127,50,0.1)]",
          numberColor: "text-amber-400",
        },
      ];

  // Avatar ring colors - duel variant uses orange
  const avatarRingColors = isDuel
    ? [
        "ring-2 ring-orange-300 ring-offset-2 ring-offset-background",
        "ring-4 ring-accent ring-offset-2 ring-offset-background shadow-[0_0_20px_rgba(255,107,53,0.6)]",
        "ring-2 ring-orange-500 ring-offset-2 ring-offset-background",
      ]
    : [
        "ring-2 ring-gray-300 ring-offset-2 ring-offset-background",
        "ring-4 ring-yellow-400 ring-offset-2 ring-offset-background shadow-[0_0_20px_rgba(255,215,0,0.6)]",
        "ring-2 ring-amber-500 ring-offset-2 ring-offset-background",
      ];

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Podium Skeleton */}
        {showPodium && (
          <div className="flex items-end justify-center gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="relative animate-pulse">
                <div className="w-28 md:w-32 rounded-t-xl bg-surface-2/50" style={{ height: i === 2 ? '10rem' : i === 1 ? '8rem' : '7rem' }}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-surface-2" />
                </div>
              </div>
            ))}
          </div>
        )}
        {/* List Skeleton */}
        {showList && (
          <div className="glass-card rounded-lg p-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-surface-1/30 rounded mb-1 animate-pulse" />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Podium */}
      {showPodium && (
        <div className="flex items-end justify-center gap-3 pt-12">
          {podiumOrder.map((entry, index) => {
            const displayValue = getDisplayValue(entry);
            const isEmpty = !entry?.userName && displayValue === 0;
            const position = positions[index];
            const style = podiumStyles[index];

            return (
              <div key={index} className="relative">
                {/* Podium Block */}
                <div
                  className={cn(
                    "w-28 md:w-32 rounded-t-xl border-2 backdrop-blur-sm transition-all relative",
                    heights[index],
                    style.bg,
                    style.border,
                    style.glow
                  )}
                >
                  {/* Avatar - positioned higher above podium */}
                  <div className={cn(
                    "absolute left-1/2 -translate-x-1/2 transition-transform hover:scale-110",
                    position === 1 ? "-top-10 scale-110" : "-top-8"
                  )}>
                    <Avatar
                      size={position === 1 ? "xl" : "lg"}
                      src={entry?.userImage}
                      name={entry?.userName || "?"}
                      className={cn(avatarRingColors[index])}
                    />
                  </div>

                  {/* Position Number - fixed distance below avatar */}
                  <div className={cn(
                    "absolute inset-x-0 text-center",
                    position === 1 ? "top-8" : "top-5"
                  )}>
                    <span className={cn(
                      "text-3xl font-bold",
                      style.numberColor
                    )}>
                      {position}
                    </span>
                  </div>

                  {/* Name & Score - fixed at bottom */}
                  <div className="absolute inset-x-0 bottom-1 text-center">
                    <span className={cn(
                      "text-sm font-semibold truncate max-w-[90px] block mx-auto",
                      isEmpty ? "text-white/50" : "text-white"
                    )}>
                      {entry?.userName || "—"}
                    </span>
                    <span className={cn(
                      "text-lg font-bold block",
                      position === 1
                        ? isDuel ? "text-accent-light" : "text-yellow-300"
                        : "text-white"
                    )}>
                      {isEmpty ? "—" : displayValue.toLocaleString()}
                      {isDuel && !isEmpty && <span className="text-xs ml-1 text-white/70">P</span>}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Remaining Rankings (4-10) */}
      {showList && rankings.length > 3 && (
        <div className={cn(
          "glass-card rounded-lg p-3",
          isDuel && "border border-accent/20"
        )}>
          {/* Duel variant title */}
          {isDuel && (
            <div className="text-center pb-2 mb-2 border-b border-surface-3">
              <span className="text-sm font-bold text-accent tracking-wider">{duelLabel.title}</span>
            </div>
          )}
          {rankings.slice(3, 10).map((entry, index) => {
            const displayValue = getDisplayValue(entry);
            const isHighlighted = index === 3;
            return (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-3 py-3 px-3 transition-colors border-b border-surface-3 last:border-b-0",
                  isHighlighted ? "bg-surface-2/60" : "hover:bg-surface-1/30"
                )}
              >
                <span className={cn(
                  "w-6 text-right text-sm font-medium",
                  isDuel ? "text-accent/70" : "text-muted-foreground"
                )}>
                  {index + 4}.
                </span>
                {entry.userImage && (
                  <Avatar
                    size="sm"
                    src={entry.userImage}
                    name={entry.userName || "?"}
                  />
                )}
                <span className="text-foreground truncate flex-1">
                  {entry.userName || "Anonym"}
                </span>
                <span className={cn(
                  "font-bold tabular-nums",
                  isDuel ? "text-accent" : "text-foreground"
                )}>
                  {displayValue.toLocaleString()}
                  {isDuel && <span className="text-xs ml-1 text-muted-foreground">{duelLabel.points}</span>}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Link to full leaderboard */}
      {showLeaderboardLink && gameType && (
        <div className="text-center">
          <Link
            href={`/${locale}/guesser/leaderboard/${encodeURIComponent(gameType)}${isDuel ? "?mode=duel" : ""}`}
            className={cn(
              "transition-colors text-sm font-medium",
              isDuel
                ? "text-accent hover:text-accent-light"
                : "text-primary hover:text-primary-light"
            )}
          >
            {locale === "en" ? "View full leaderboard →" : locale === "sl" ? "Poglej celotno lestvico →" : "Komplette Rangliste anzeigen →"}
          </Link>
        </div>
      )}
    </div>
  );
});
