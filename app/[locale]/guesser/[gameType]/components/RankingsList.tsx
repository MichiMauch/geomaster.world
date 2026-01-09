"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import type { RankingEntry, TabType } from "../types";
import { ITEMS_PER_PAGE } from "../constants";

interface RankingsListProps {
  locale: string;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  rankings: RankingEntry[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const tabLabels: Record<string, Record<TabType, string>> = {
  de: { weekly: "Woche", best: "Beste", total: "Total" },
  en: { weekly: "Weekly", best: "Best", total: "Total" },
  sl: { weekly: "Teden", best: "Najboljši", total: "Skupaj" },
};

const emptyLabels: Record<string, string> = {
  de: "Noch keine Einträge",
  en: "No entries yet",
  sl: "Še brez vnosov",
};

const paginationLabels: Record<string, { prev: string; next: string }> = {
  de: { prev: "Zurück", next: "Weiter" },
  en: { prev: "Prev", next: "Next" },
  sl: { prev: "Nazaj", next: "Naprej" },
};

function getRankDisplay(index: number, page: number) {
  const absoluteRank = (page - 1) * ITEMS_PER_PAGE + index;
  if (absoluteRank === 0) return "🥇";
  if (absoluteRank === 1) return "🥈";
  if (absoluteRank === 2) return "🥉";
  return `${absoluteRank + 1}.`;
}

export const RankingsList = memo(function RankingsList({
  locale,
  activeTab,
  onTabChange,
  rankings,
  loading,
  currentPage,
  totalPages,
  onPageChange,
}: RankingsListProps) {
  const tabs = tabLabels[locale] || tabLabels.de;
  const emptyLabel = emptyLabels[locale] || emptyLabels.de;
  const pagination = paginationLabels[locale] || paginationLabels.de;

  return (
    <Card className="p-4">
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(["weekly", "best", "total"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={cn(
              "px-4 py-2 rounded-sm text-sm font-medium transition-colors cursor-pointer",
              activeTab === tab
                ? "bg-primary text-white"
                : "bg-surface-2 text-muted-foreground hover:bg-surface-3"
            )}
          >
            {tabs[tab]}
          </button>
        ))}
      </div>

      {/* Rankings List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
            <div key={i} className="h-8 bg-surface-2 rounded-sm animate-pulse" />
          ))}
        </div>
      ) : rankings.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {emptyLabel}
        </p>
      ) : (
        <div className="space-y-1">
          {rankings.map((entry, index) => (
            <div
              key={index}
              className="flex items-center gap-3 py-2 border-b border-surface-3 last:border-0"
            >
              <span className="w-8 text-center text-lg">
                {getRankDisplay(index, currentPage)}
              </span>
              <span className="text-foreground truncate flex-1">
                {entry.userName || "Anonym"}
              </span>
              <span className="text-foreground font-bold tabular-nums">
                {activeTab === "total" ? entry.totalScore?.toLocaleString() : entry.bestScore}
              </span>
              {activeTab === "total" && entry.totalGames && (
                <span className="text-muted-foreground text-sm">
                  ({entry.totalGames})
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-surface-3">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={cn(
              "px-3 py-1.5 rounded-sm text-sm cursor-pointer",
              currentPage === 1
                ? "bg-surface-2 text-muted-foreground opacity-50"
                : "bg-surface-2 text-foreground hover:bg-surface-3"
            )}
          >
            {pagination.prev}
          </button>

          <span className="text-sm text-muted-foreground px-2">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={cn(
              "px-3 py-1.5 rounded-sm text-sm cursor-pointer",
              currentPage === totalPages
                ? "bg-surface-2 text-muted-foreground opacity-50"
                : "bg-surface-2 text-foreground hover:bg-surface-3"
            )}
          >
            {pagination.next}
          </button>
        </div>
      )}
    </Card>
  );
});
