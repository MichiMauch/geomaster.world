"use client";

import { Play, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GameTypeConfig } from "@/lib/game-types";

export interface TopPlayer {
  rank: number;
  userName: string | null;
  bestScore: number;
}

interface GameTypeCardProps {
  config: GameTypeConfig;
  locale: string;
  topPlayers: TopPlayer[];
  loading: boolean;
  isStarting: boolean;
  onStartGame: (gameTypeId: string) => void;
  onViewDetails: (gameTypeId: string) => void;
  /** Card variant: "overlay" has background image, "flat" is simple */
  variant?: "overlay" | "flat";
  /** Background image URL (only for overlay variant) */
  backgroundImage?: string;
  /** Flag/icon image URL (replaces emoji icon if provided) */
  flagImage?: string;
}

/**
 * Reusable game type card for guesser category pages.
 * Supports two variants:
 * - "overlay": Card with background image, dark gradient, white text
 * - "flat": Simple card with surface background
 */
export function GameTypeCard({
  config,
  locale,
  topPlayers,
  loading,
  isStarting,
  onStartGame,
  onViewDetails,
  variant = "flat",
  backgroundImage,
  flagImage,
}: GameTypeCardProps) {
  const localeKey = locale as "de" | "en" | "sl";
  const name = config.name[localeKey] || config.name.en;

  const startGameTitle = locale === "de" ? "Spiel starten" : locale === "en" ? "Start game" : "Zacni igro";
  const leaderboardTitle = locale === "de" ? "Rangliste" : locale === "en" ? "Leaderboard" : "Lestvica";
  const noPlayersText = locale === "de" ? "Noch keine Spieler" : locale === "en" ? "No players yet" : "Se brez igralcev";

  if (variant === "overlay") {
    return (
      <div className="group relative overflow-hidden rounded-xl border border-white/10 hover:border-primary transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-[0_10px_30px_-10px_rgba(0,217,255,0.4)] min-h-[240px]">
        {/* Background image */}
        {backgroundImage && (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundImage: `url('${backgroundImage}')` }}
          />
        )}

        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30 group-hover:from-black/70 group-hover:via-black/40 transition-colors" />

        {/* Content */}
        <div className="relative z-10 p-5 flex flex-col h-full">
          {/* Header: Icon/Flag + Name + Action Buttons */}
          <div className="flex items-center gap-3 mb-3">
            {flagImage ? (
              <img src={flagImage} alt={name} className="w-10 h-auto" />
            ) : (
              <span className="text-3xl">{config.icon}</span>
            )}
            <span className="text-lg font-bold flex-1 text-white">
              {name}
            </span>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onStartGame(config.id)}
                disabled={isStarting}
                title={startGameTitle}
                className={cn(
                  "p-2 rounded-sm transition-all cursor-pointer",
                  "bg-white/20 hover:bg-white/30 text-white",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isStarting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => onViewDetails(config.id)}
                title={leaderboardTitle}
                className={cn(
                  "p-2 rounded-sm transition-all cursor-pointer",
                  "bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
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
                  <div key={i} className="h-4 bg-white/20 rounded-sm animate-pulse w-3/4" />
                ))}
              </div>
            ) : topPlayers.length === 0 ? (
              <p className="text-xs text-white/60">{noPlayersText}</p>
            ) : (
              <div className="space-y-1">
                {topPlayers.map((player, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <span className="w-4 text-center">
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`}
                    </span>
                    <span className="text-white/70 truncate flex-1">
                      {player.userName || "Anonym"}
                    </span>
                    <span className="text-white font-medium">
                      {player.bestScore}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Flat variant (default)
  return (
    <div className="flex flex-col p-4 rounded-lg border transition-all duration-200 bg-surface-1 border-surface-3 hover:border-primary/50 min-h-[160px]">
      {/* Header: Icon + Name + Action Buttons */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{config.icon}</span>
        <span className="text-base font-semibold flex-1 text-foreground">
          {name}
        </span>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onStartGame(config.id)}
            disabled={isStarting}
            title={startGameTitle}
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
            onClick={() => onViewDetails(config.id)}
            title={leaderboardTitle}
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
        ) : topPlayers.length === 0 ? (
          <p className="text-xs text-muted-foreground">{noPlayersText}</p>
        ) : (
          <div className="space-y-1">
            {topPlayers.map((player, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <span className="w-4 text-center">
                  {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`}
                </span>
                <span className="text-muted-foreground truncate flex-1">
                  {player.userName || "Anonym"}
                </span>
                <span className="text-foreground font-medium">
                  {player.bestScore}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
