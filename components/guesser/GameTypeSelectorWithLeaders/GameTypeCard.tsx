"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { Play, Trophy } from "lucide-react";
import type { GameTypeConfig } from "@/lib/game-types";
import type { TopPlayer } from "./types";

interface GameTypeCardProps {
  config: GameTypeConfig;
  isSelected: boolean;
  players: TopPlayer[];
  loading: boolean;
  isStarting: boolean;
  locale: string;
  onStartGame: () => void;
  onViewDetails: () => void;
}

const labels: Record<string, { noPlayers: string; startGame: string; leaderboard: string }> = {
  de: { noPlayers: "Noch keine Spieler", startGame: "Spiel starten", leaderboard: "Rangliste" },
  en: { noPlayers: "No players yet", startGame: "Start game", leaderboard: "Leaderboard" },
  sl: { noPlayers: "Še brez igralcev", startGame: "Začni igro", leaderboard: "Lestvica" },
};

export const GameTypeCard = memo(function GameTypeCard({
  config,
  isSelected,
  players,
  loading,
  isStarting,
  locale,
  onStartGame,
  onViewDetails,
}: GameTypeCardProps) {
  const label = labels[locale] || labels.de;
  const localeKey = locale as "de" | "en" | "sl";
  const name = config.name[localeKey] || config.name.en;

  return (
    <div
      className={cn(
        "flex flex-col p-4 rounded-sm border transition-all duration-200",
        "min-h-[160px]",
        isSelected
          ? "bg-primary/10 border-primary"
          : "bg-surface-1 border-surface-3"
      )}
    >
      {/* Header: Icon + Name + Action Buttons */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{config.icon}</span>
        <span
          className={cn(
            "text-base font-semibold flex-1",
            isSelected ? "text-primary" : "text-foreground"
          )}
        >
          {name}
        </span>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onStartGame}
            disabled={isStarting}
            title={label.startGame}
            className={cn(
              "p-2 rounded-sm transition-all cursor-pointer",
              "bg-primary/10 hover:bg-primary/20 text-primary",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isStarting ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={onViewDetails}
            title={label.leaderboard}
            className={cn(
              "p-2 rounded-sm transition-all cursor-pointer",
              "bg-surface-2 hover:bg-surface-3 text-muted-foreground hover:text-foreground"
            )}
          >
            <Trophy className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Top 3 Players */}
      <div className="flex-1">
        {loading ? (
          <div className="space-y-1.5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-surface-2 rounded-sm animate-pulse w-3/4" />
            ))}
          </div>
        ) : players.length === 0 ? (
          <p className="text-xs text-muted-foreground">{label.noPlayers}</p>
        ) : (
          <div className="space-y-1">
            {players.map((player, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <span className="w-4 text-center">
                  {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`}
                </span>
                <span className="text-muted-foreground truncate flex-1">
                  {player.userName || "Anonym"}
                </span>
                <span className="text-foreground font-medium">{player.bestScore}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
