"use client";

import Image from "next/image";
import type { GameTypeConfig } from "@/lib/game-types";

/** Cyberpunk-style 3D Play Button with glass effect and neon glow */
function CyberpunkPlayButton({ size = "lg" }: { size?: "lg" | "sm" }) {
  const isLarge = size === "lg";

  return (
    <div className="relative">
      {/* Glow/Reflection under button */}
      <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 bg-primary/40 blur-md rounded-full
        ${isLarge ? "w-10 h-2" : "w-8 h-1.5"}
        group-hover:bg-primary/60 transition-all duration-300
      `} />

      {/* Button container with 3D effect */}
      <div className={`relative transform-gpu
        group-hover:scale-110 group-hover:-translate-y-1
        transition-all duration-300
        ${isLarge ? "w-14 h-14" : "w-11 h-11"}
      `}>
        {/* 3D depth layer (shadow beneath) */}
        <div className={`absolute inset-0 rounded-xl translate-y-1.5 bg-slate-950/90
          ${isLarge ? "rounded-xl" : "rounded-lg"}
        `} />

        {/* Glass base layer */}
        <div className={`
          absolute inset-0
          bg-slate-900/80 backdrop-blur-sm
          border border-primary/40
          shadow-[0_0_20px_rgba(0,217,255,0.25),inset_0_1px_1px_rgba(255,255,255,0.1)]
          group-hover:shadow-[0_0_30px_rgba(0,217,255,0.5),inset_0_1px_2px_rgba(255,255,255,0.2)]
          group-hover:border-primary/70
          group-hover:bg-slate-800/80
          transition-all duration-300
          ${isLarge ? "rounded-xl" : "rounded-lg"}
        `} />

        {/* Wireframe triangle icon */}
        <svg
          className={`absolute inset-0 m-auto transition-all duration-300
            drop-shadow-[0_0_8px_rgba(0,217,255,0.9)]
            group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.9)]
            ${isLarge ? "w-6 h-6" : "w-5 h-5"}
          `}
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M8 5.14v13.72a1 1 0 001.5.86l11-6.86a1 1 0 000-1.72l-11-6.86a1 1 0 00-1.5.86z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            fill="transparent"
            className="text-primary group-hover:text-white group-hover:fill-white transition-all duration-300"
          />
        </svg>
      </div>
    </div>
  );
}

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
        className="group relative overflow-hidden rounded-xl border border-primary/40 hover:border-primary transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-[0_10px_30px_-10px_rgba(0,217,255,0.4)] min-h-[240px] cursor-pointer"
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

        {/* Cyberpunk Play Button - bottom right */}
        <div className="absolute bottom-4 right-4 z-20">
          <CyberpunkPlayButton size="lg" />
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

      {/* Cyberpunk Play Button - bottom right */}
      <div className="absolute bottom-3 right-3">
        <CyberpunkPlayButton size="sm" />
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
