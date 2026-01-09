"use client";

import { memo } from "react";

interface MyStatsProps {
  locale: string;
  loading: boolean;
  personalGames: number;
  personalBest: number;
  personalTotalScore: number;
}

const labels: Record<string, { title: string; games: string; best: string; total: string }> = {
  de: { title: "Deine Stats", games: "Spiele", best: "Best", total: "Total" },
  en: { title: "Your Stats", games: "Games", best: "Best", total: "Total" },
  sl: { title: "Tvoje statistike", games: "Igre", best: "Najboljši", total: "Skupaj" },
};

export const MyStats = memo(function MyStats({
  locale,
  loading,
  personalGames,
  personalBest,
  personalTotalScore,
}: MyStatsProps) {
  const label = labels[locale] || labels.de;

  return (
    <>
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
        {label.title}
      </h3>

      {loading ? (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-surface-2 rounded-sm animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 bg-surface-2 rounded-sm">
            <div className="text-lg font-bold text-foreground">{personalGames}</div>
            <div className="text-xs text-muted-foreground">{label.games}</div>
          </div>
          <div className="text-center p-2 bg-surface-2 rounded-sm">
            <div className="text-lg font-bold text-foreground">{personalBest || "—"}</div>
            <div className="text-xs text-muted-foreground">{label.best}</div>
          </div>
          <div className="text-center p-2 bg-surface-2 rounded-sm">
            <div className="text-lg font-bold text-primary">
              {personalTotalScore.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">{label.total}</div>
          </div>
        </div>
      )}
    </>
  );
});
