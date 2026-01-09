"use client";

import { memo } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { MedalBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export interface RankingEntry {
  rank: number;
  userId: string;
  userName: string | null;
  userImage: string | null;
  totalScore: number;
  totalGames: number;
  averageScore: number;
  bestScore: number;
}

interface RankingsTableProps {
  rankings: RankingEntry[];
  highlightUserId?: string;
  loading?: boolean;
}

interface RankingRowProps {
  entry: RankingEntry;
  isCurrentUser: boolean;
  labels: {
    anonymous: string;
    you: string;
  };
}

const RankingRow = memo(function RankingRow({ entry, isCurrentUser, labels }: RankingRowProps) {
  const isTopThree = entry.rank <= 3;

  return (
    <tr
      className={cn(
        "transition-colors hover:bg-accent/5",
        isCurrentUser && "bg-primary/10 hover:bg-primary/15"
      )}
    >
      {/* Rank */}
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          {isTopThree ? (
            <MedalBadge position={entry.rank} />
          ) : (
            <span className="font-medium text-foreground">#{entry.rank}</span>
          )}
        </div>
      </td>

      {/* Player */}
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <Avatar src={entry.userImage} size="sm" />
          <span className={cn(
            "font-medium",
            isCurrentUser ? "text-primary font-semibold" : "text-foreground"
          )}>
            {entry.userName || labels.anonymous}
            {isCurrentUser && (
              <span className="ml-2 text-xs text-muted-foreground">
                ({labels.you})
              </span>
            )}
          </span>
        </div>
      </td>

      {/* Best Score */}
      <td className="px-4 py-4 whitespace-nowrap text-right">
        <span className="text-foreground">{entry.bestScore}</span>
      </td>

      {/* Games Played */}
      <td className="px-4 py-4 whitespace-nowrap text-right">
        <span className="text-muted-foreground">{entry.totalGames}</span>
      </td>

      {/* Total Score */}
      <td className="px-4 py-4 whitespace-nowrap text-right">
        <span className="font-semibold text-foreground">
          {entry.totalScore.toLocaleString()}
        </span>
      </td>

      {/* Average Score */}
      <td className="px-4 py-4 whitespace-nowrap text-right">
        <span className="text-muted-foreground">{entry.averageScore.toFixed(1)}</span>
      </td>
    </tr>
  );
});

export default function RankingsTable({ rankings, highlightUserId, loading = false }: RankingsTableProps) {
  const t = useTranslations("ranked");

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (rankings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t("noRankings", { defaultValue: "Noch keine Rankings vorhanden. Sei der Erste!" })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50">
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("rank", { defaultValue: "Rang" })}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("player", { defaultValue: "Spieler" })}
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("bestScore", { defaultValue: "Beste" })}
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("games", { defaultValue: "Spiele" })}
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("totalScore", { defaultValue: "Gesamt" })}
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("avgScore", { defaultValue: "Ø Punkte" })}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {rankings.map((entry) => (
            <RankingRow
              key={entry.userId}
              entry={entry}
              isCurrentUser={entry.userId === highlightUserId}
              labels={{
                anonymous: t("anonymous", { defaultValue: "Anonym" }),
                you: t("you", { defaultValue: "Du" }),
              }}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
