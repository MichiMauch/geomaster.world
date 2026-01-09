"use client";

import { memo } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { MedalBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { formatDistance, formatTotalDistance } from "@/lib/distance";
import type { LeaderboardEntry, LeaderboardType } from "./types";

interface LeaderboardEntryRowProps {
  entry: LeaderboardEntry;
  index: number;
  isClickable: boolean;
  type: LeaderboardType;
  selectedRound: number | null;
  currentGameType: string | null;
  onClick: () => void;
  labels: {
    notMember: string;
    days: string;
    points: string;
    game: string;
    games: string;
  };
}

export const LeaderboardEntryRow = memo(function LeaderboardEntryRow({
  entry,
  index,
  isClickable,
  type,
  selectedRound,
  currentGameType,
  onClick,
  labels,
}: LeaderboardEntryRowProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-all",
        entry.rank === 1 && "bg-accent/10 border border-accent/30",
        entry.rank === 2 && "bg-surface-2 border border-glass-border",
        entry.rank === 3 && "bg-warning/10 border border-warning/30",
        entry.rank > 3 && "hover:bg-surface-2",
        isClickable && "cursor-pointer hover:ring-2 hover:ring-primary/30"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Rank */}
      {entry.rank <= 3 ? (
        <MedalBadge position={entry.rank as 1 | 2 | 3} />
      ) : (
        <div className="w-10 h-10 rounded-full bg-surface-3 flex items-center justify-center">
          <span className="text-body font-bold text-text-secondary">{entry.rank}</span>
        </div>
      )}

      {/* Avatar */}
      <Avatar src={entry.userImage} name={entry.userName} size="md" />

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary truncate">
          {entry.userName}
          {entry.isMember === false && (
            <span className="ml-2 text-caption text-text-muted italic">{labels.notMember}</span>
          )}
        </p>
        {type === "weekly" && selectedRound === null && !entry.completed && entry.isMember !== false && (
          <p className="text-caption text-text-muted">{entry.roundsPlayed} {labels.days}</p>
        )}
      </div>

      {/* Score & Distance */}
      <div className="text-right">
        <p className={cn("font-bold tabular-nums", entry.rank === 1 ? "text-accent" : "text-text-primary")}>
          {entry.totalScore} {labels.points}
        </p>
        <p className="text-caption text-text-muted tabular-nums">
          {type === "weekly" && selectedRound !== null
            ? formatDistance(entry.totalDistance, currentGameType)
            : formatTotalDistance(entry.totalDistance)}
        </p>
        {type === "alltime" && entry.gamesPlayed && (
          <p className="text-caption text-text-muted">
            {entry.gamesPlayed} {entry.gamesPlayed === 1 ? labels.game : labels.games}
          </p>
        )}
      </div>
    </div>
  );
});
