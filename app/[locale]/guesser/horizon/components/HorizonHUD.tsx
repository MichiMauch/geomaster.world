import { memo } from "react";
import { Badge } from "@/components/ui/Badge";
import type { GamePhase } from "../hooks/useHorizon";
import { getCategoryLabel } from "../constants";

interface HorizonHUDProps {
  score: number;
  highscore: number;
  availablePoints: number;
  lastRoundPoints: number | null;
  roundKey: number;
  scoreAnimating: boolean;
  phase: GamePhase;
  category: string;
  locale: string;
}

export const HorizonHUD = memo(function HorizonHUD({
  score,
  highscore,
  availablePoints,
  lastRoundPoints,
  roundKey,
  scoreAnimating,
  phase,
  category,
  locale,
}: HorizonHUDProps) {
  const totalSegments = 20;
  const filledSegments = Math.round((availablePoints / 1000) * totalSegments);

  return (
    <div className="flex flex-col items-center mb-1.5 md:mb-5">
      {/* Glass Dashboard — only visible on desktop */}
      <div className="md:hud-glass-panel md:px-10 md:py-4 md:mb-2 flex flex-col items-center">
        {/* Score row: Best | SCORE | Pts */}
        <div className="flex items-end justify-center gap-3 md:gap-6">
          {/* Best */}
          <div className="flex flex-col items-center">
            <span className="text-[8px] md:text-[11px] uppercase tracking-[0.2em] text-white/40">Best</span>
            <span className="text-sm md:text-xl font-mono font-bold text-white/30 tabular-nums">
              {highscore.toLocaleString("de-CH")}
            </span>
          </div>

          {/* Divider — desktop only */}
          <div className="hidden md:block w-px h-10 bg-white/10" />

          {/* Main score */}
          <div className="relative flex flex-col items-center">
            <span className="text-[8px] md:text-[11px] uppercase tracking-[0.25em] text-white/50">Score</span>
            <span
              className={`hud-score-massive text-4xl md:text-7xl font-mono font-black tabular-nums leading-none ${
                scoreAnimating ? "animate-score-pop" : ""
              }`}
            >
              {score.toLocaleString("de-CH")}
            </span>
            {lastRoundPoints !== null && (
              <span
                key={`pts-${roundKey}`}
                className="absolute -right-10 md:-right-16 top-2 md:top-3 text-sm md:text-xl font-mono font-bold text-success animate-float-up"
                style={{ textShadow: "0 0 10px rgba(0,255,136,0.6)" }}
              >
                +{lastRoundPoints}
              </span>
            )}
          </div>

          {/* Divider — desktop only */}
          <div className="hidden md:block w-px h-10 bg-white/10" />

          {/* Points countdown */}
          <div className={`flex flex-col items-center ${phase !== "playing" ? "invisible" : ""}`}>
            <span className="text-[8px] md:text-[11px] uppercase tracking-[0.2em] text-white/40">Pts</span>
            <span
              className={`text-sm md:text-xl font-mono font-bold tabular-nums ${
                availablePoints > 550
                  ? "text-primary"
                  : availablePoints > 250
                    ? "text-accent"
                    : "text-error"
              }`}
              style={availablePoints > 550 ? {
                textShadow: "0 0 8px rgba(0,217,255,0.5)"
              } : availablePoints <= 250 ? {
                textShadow: "0 0 8px rgba(255,51,102,0.5)"
              } : undefined}
            >
              {availablePoints}
            </span>
          </div>
        </div>

        {/* Segmented Energy Bar */}
        <div className={`flex gap-[2px] md:gap-1 mt-1 md:mt-3 mb-1 md:mb-0 ${phase !== "playing" ? "invisible" : ""}`}>
          {Array.from({ length: totalSegments }, (_, i) => {
            const active = i < filledSegments;
            return (
              <div
                key={i}
                className={`w-2.5 md:w-5 h-2 md:h-3 rounded-sm transition-all duration-200 ${
                  active ? "hud-segment-active" : "bg-white/8"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Category */}
      <Badge variant="accent" size="sm">
        {getCategoryLabel(category, locale)}
      </Badge>
    </div>
  );
});
