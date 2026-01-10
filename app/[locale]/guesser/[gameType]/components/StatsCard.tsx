"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  locale: string;
  loading: boolean;
  personalBest: number;
  personalTotalScore: number;
  topPercentage: number | null; // e.g., 5 = Top 5%
  userRank: number | null;
  totalPlayers: number;
}

const labels: Record<string, { title: string; best: string; total: string; topText: string; topTextSuffix: string }> = {
  de: { title: "DEINE STATS", best: "Best", total: "Total", topText: "Du bist in den Top", topTextSuffix: "aller Spieler!" },
  en: { title: "YOUR STATS", best: "Best", total: "Total", topText: "You're in the Top", topTextSuffix: "of all players!" },
  sl: { title: "TVOJE STATISTIKE", best: "Najboljši", total: "Skupaj", topText: "Si v Top", topTextSuffix: "vseh igralcev!" },
};

// Ring progress component
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
        stroke="url(#statsGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
      />
      <defs>
        <linearGradient id="statsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--primary-light)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Bar chart component (like in mockup)
function BarChart({ value, max }: { value: number; max: number }) {
  const bars = 5;
  const filledBars = Math.ceil((value / max) * bars);

  return (
    <div className="flex items-end gap-1 h-16">
      {[...Array(bars)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-3 rounded-sm transition-all",
            i < filledBars ? "bg-primary" : "bg-surface-3"
          )}
          style={{ height: `${20 + (i + 1) * 15}%` }}
        />
      ))}
    </div>
  );
}

export const StatsCard = memo(function StatsCard({
  locale,
  loading,
  personalBest,
  personalTotalScore,
  topPercentage,
  userRank,
  totalPlayers,
}: StatsCardProps) {
  const label = labels[locale] || labels.de;

  // Calculate ring percentage (inverse - top 1% should show nearly full ring)
  const ringPercentage = topPercentage !== null ? Math.max(5, 100 - topPercentage) : 0;

  if (loading) {
    return (
      <div className="glass-card p-5 rounded-xl">
        <h3 className="text-sm font-bold text-foreground tracking-wider mb-4 text-center">
          {label.title}
        </h3>
        <div className="grid grid-cols-2 gap-6 animate-pulse">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-surface-2" />
            <div className="w-16 h-6 bg-surface-2 rounded mt-2" />
          </div>
          <div className="flex flex-col items-center">
            <div className="flex gap-1 h-16">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-3 bg-surface-2 rounded-sm" style={{ height: `${20 + (i + 1) * 15}%` }} />
              ))}
            </div>
            <div className="w-16 h-6 bg-surface-2 rounded mt-2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 rounded-xl">
      {/* Title */}
      <h3 className="text-sm font-bold text-foreground tracking-wider mb-4 text-center">
        {label.title}
      </h3>

      {/* Two columns: Ring+Best | BarChart+Total */}
      <div className="grid grid-cols-2 gap-6 mb-4">
        {/* Left column: Ring + Best */}
        <div className="flex flex-col items-center">
          <RingProgress percentage={ringPercentage} size={80} />
          <span className="text-2xl font-bold text-primary mt-2">
            {personalBest > 0 ? personalBest.toLocaleString() : "—"}
          </span>
          <span className="text-xs text-muted-foreground">{label.best}</span>
        </div>

        {/* Right column: BarChart + Total */}
        <div className="flex flex-col items-center">
          <BarChart value={personalBest} max={750} />
          <span className="text-2xl font-bold text-foreground mt-2">
            {personalTotalScore > 0 ? personalTotalScore.toLocaleString() : "—"}
          </span>
          <span className="text-xs text-muted-foreground">{label.total}</span>
        </div>
      </div>

      {/* Top % Text */}
      {topPercentage !== null && (
        <p className="text-center text-sm text-muted-foreground">
          {label.topText}{" "}
          <span className="font-bold text-foreground">{topPercentage}%</span>{" "}
          {label.topTextSuffix}
        </p>
      )}
    </div>
  );
});
