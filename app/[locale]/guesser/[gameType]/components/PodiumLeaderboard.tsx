"use client";

import { memo } from "react";
import Link from "next/link";
import type { RankingEntry } from "../types";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";

interface PodiumLeaderboardProps {
  rankings: RankingEntry[];
  loading: boolean;
  locale: string;
  gameType?: string;
  showPodium?: boolean;
  showList?: boolean;
  showLeaderboardLink?: boolean;
}

export const PodiumLeaderboard = memo(function PodiumLeaderboard({
  rankings,
  loading,
  locale,
  gameType,
  showPodium = true,
  showList = true,
  showLeaderboardLink = false,
}: PodiumLeaderboardProps) {
  // Fill with empty entries if less than 3
  const top3 = [...rankings.slice(0, 3)];
  while (top3.length < 3) {
    top3.push({ rank: top3.length + 1, userName: null, bestScore: 0 });
  }

  // Podium order: 2nd, 1st, 3rd (for visual display)
  const podiumOrder = [top3[1], top3[0], top3[2]];
  const heights = ["h-32", "h-40", "h-28"];
  const positions = [2, 1, 3];

  // Very transparent podium backgrounds (15-20%) with glow borders
  const podiumStyles = [
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

  // Avatar ring colors
  const avatarRingColors = [
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
            const isEmpty = !entry?.userName && entry?.bestScore === 0;
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
                      position === 1 ? "text-yellow-300" : "text-white"
                    )}>
                      {isEmpty ? "—" : entry?.bestScore?.toLocaleString()}
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
        <div className="glass-card rounded-lg p-3">
          {rankings.slice(3, 10).map((entry, index) => {
            const isHighlighted = index === 3;
            return (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-3 py-3 px-3 transition-colors border-b border-surface-3 last:border-b-0",
                  isHighlighted ? "bg-surface-2/60" : "hover:bg-surface-1/30"
                )}
              >
                <span className="w-6 text-right text-sm font-medium text-muted-foreground">
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
                <span className="text-foreground font-bold tabular-nums">
                  {entry.bestScore.toLocaleString()}
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
            href={`/${locale}/guesser/leaderboard/${encodeURIComponent(gameType)}`}
            className="text-primary hover:text-primary-light transition-colors text-sm font-medium"
          >
            {locale === "en" ? "View full leaderboard →" : locale === "sl" ? "Poglej celotno lestvico →" : "Komplette Rangliste anzeigen →"}
          </Link>
        </div>
      )}
    </div>
  );
});
