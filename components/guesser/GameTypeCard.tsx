"use client";

import Image from "next/image";
import { Play } from "lucide-react";
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
 * Clicking the card navigates to the detail page.
 * Supports two variants:
 * - "overlay": Card with background image, dark gradient, white text
 * - "flat": Simple card with surface background
 */
export function GameTypeCard({
  config,
  locale,
  topPlayers,
  loading,
  onViewDetails,
  variant = "flat",
  backgroundImage,
  flagImage,
}: GameTypeCardProps) {
  const localeKey = locale as "de" | "en" | "sl";
  const name = config.name[localeKey] || config.name.en;

  const noPlayersText = locale === "de" ? "Noch keine Spieler" : locale === "en" ? "No players yet" : "Se brez igralcev";
  const locationsText = locale === "de" ? "Orte" : locale === "en" ? "locations" : "lokacij";

  if (variant === "overlay") {
    return (
      <div
        onClick={() => onViewDetails(config.id)}
        className="group relative overflow-hidden rounded-xl border border-white/10 hover:border-primary transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-[0_10px_30px_-10px_rgba(0,217,255,0.4)] min-h-[240px] cursor-pointer"
      >
        {/* Background image */}
        {backgroundImage && (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundImage: `url('${backgroundImage}')` }}
          />
        )}

        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30 group-hover:from-black/70 group-hover:via-black/40 transition-colors" />

        {/* Play Button - bottom right */}
        <div className="absolute bottom-4 right-4 z-20">
          <div className="w-12 h-12 rounded-full bg-primary/90 group-hover:bg-primary group-hover:scale-110 transition-all duration-300 flex items-center justify-center shadow-lg">
            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 p-5 flex flex-col h-full">
          {/* Header: Icon/Flag + Name */}
          <div className="flex items-center gap-3 mb-3">
            {flagImage ? (
              <Image src={flagImage} alt={name} width={40} height={30} className="w-10 h-auto" unoptimized />
            ) : (
              <span className="text-3xl">{config.icon}</span>
            )}
            <div className="flex-1">
              <span className="text-lg font-bold text-white">{name}</span>
              {config.locationCount !== undefined && config.locationCount > 0 && (
                <span className="text-xs text-white/60 ml-2">
                  ({config.locationCount} {locationsText})
                </span>
              )}
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
    <div
      onClick={() => onViewDetails(config.id)}
      className="group relative flex flex-col p-4 rounded-lg border transition-all duration-200 bg-surface-1 border-surface-3 hover:border-primary/50 min-h-[160px] cursor-pointer"
    >
      {/* Header: Icon + Name */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{config.icon}</span>
        <div className="flex-1">
          <span className="text-base font-semibold text-foreground">{name}</span>
          {config.locationCount !== undefined && config.locationCount > 0 && (
            <span className="text-xs text-muted-foreground ml-2">
              ({config.locationCount} {locationsText})
            </span>
          )}
        </div>
      </div>

      {/* Play Button - bottom right */}
      <div className="absolute bottom-3 right-3">
        <div className="w-10 h-10 rounded-full bg-primary/80 group-hover:bg-primary group-hover:scale-110 transition-all duration-300 flex items-center justify-center">
          <Play className="w-5 h-5 text-white fill-white ml-0.5" />
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
