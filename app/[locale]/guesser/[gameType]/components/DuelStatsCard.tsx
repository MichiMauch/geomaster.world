"use client";

import { memo } from "react";

interface DuelStatsCardProps {
  locale: string;
  loading: boolean;
  wins: number;
  losses: number;
  winRate: number;
  totalDuels: number;
  rank: number | null;
}

const labels: Record<string, { title: string; wins: string; winRate: string; duels: string; rank: string }> = {
  de: {
    title: "DEINE STATS",
    wins: "Siege",
    winRate: "Win-Rate",
    duels: "Duelle",
    rank: "Rang",
  },
  en: {
    title: "YOUR STATS",
    wins: "Wins",
    winRate: "Win Rate",
    duels: "Duels",
    rank: "Rank",
  },
  sl: {
    title: "TVOJE STATISTIKE",
    wins: "Zmage",
    winRate: "Stopnja zmag",
    duels: "Dvoboji",
    rank: "Uvrstitev",
  },
};

// Ring progress component (orange accent)
function RingProgress({ percentage, size = 80, strokeWidth = 6 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-surface-3"
      />
      {/* Progress ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#duelGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
      />
      <defs>
        <linearGradient id="duelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent-light)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export const DuelStatsCard = memo(function DuelStatsCard({
  locale,
  loading,
  wins,
  losses,
  winRate,
  totalDuels,
  rank,
}: DuelStatsCardProps) {
  const t = labels[locale] || labels.de;

  if (loading) {
    return (
      <div className="glass-card p-5 rounded-xl border-accent/30">
        <h3 className="text-sm font-bold text-foreground tracking-wider mb-4 text-center">
          {t.title}
        </h3>
        <div className="grid grid-cols-2 gap-6 animate-pulse">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-surface-2" />
            <div className="w-16 h-6 bg-surface-2 rounded mt-2" />
          </div>
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-surface-2" />
            <div className="w-16 h-6 bg-surface-2 rounded mt-2" />
          </div>
        </div>
      </div>
    );
  }

  // Calculate win rate percentage for ring (0-100)
  const winRatePercentage = Math.round(winRate * 100);

  return (
    <div className="glass-card p-5 rounded-xl border border-accent/30 shadow-[0_0_20px_rgba(255,107,53,0.15)]">
      {/* Title */}
      <h3 className="text-sm font-bold text-foreground tracking-wider mb-4 text-center">
        {t.title}
      </h3>

      {/* Two columns: Wins | Win-Rate */}
      <div className="grid grid-cols-2 gap-6 mb-4">
        {/* Left column: Wins */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <RingProgress percentage={totalDuels > 0 ? (wins / totalDuels) * 100 : 0} size={80} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-accent">
                {wins}
              </span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground mt-2">{t.wins}</span>
        </div>

        {/* Right column: Win Rate */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <RingProgress percentage={winRatePercentage} size={80} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-foreground">
                {winRatePercentage}%
              </span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground mt-2">{t.winRate}</span>
        </div>
      </div>

      {/* Bottom stats */}
      <div className="flex justify-center gap-6 pt-3 border-t border-surface-3">
        <div className="text-center">
          <span className="text-lg font-bold text-foreground">{totalDuels}</span>
          <span className="text-xs text-muted-foreground ml-1">{t.duels}</span>
        </div>
        {rank !== null && (
          <div className="text-center">
            <span className="text-lg font-bold text-accent">#{rank}</span>
            <span className="text-xs text-muted-foreground ml-1">{t.rank}</span>
          </div>
        )}
      </div>
    </div>
  );
});
