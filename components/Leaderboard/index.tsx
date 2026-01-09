"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import PlayerResultsModal from "../PlayerResultsModal";
import { useLeaderboard } from "./hooks";
import { LeaderboardEntryRow } from "./LeaderboardEntryRow";
import { TypeToggle } from "./TypeToggle";
import { RoundTabs } from "./RoundTabs";
import type { LeaderboardProps, LeaderboardEntry } from "./types";

export default function Leaderboard({ groupId, gameId, blurred = false }: LeaderboardProps) {
  const { data: session } = useSession();
  const t = useTranslations("leaderboard");
  const [selectedPlayer, setSelectedPlayer] = useState<LeaderboardEntry | null>(null);

  const {
    leaderboard,
    type,
    setType,
    loading,
    maxRoundNumber,
    selectedRound,
    setSelectedRound,
    currentGameId,
    currentGameType,
    showBlur,
    revealed,
  } = useLeaderboard({ groupId, gameId, blurred });

  // Can click on a player if revealed OR if it's the current user
  const canClickPlayer = (userId: string) => {
    if (type !== "weekly") return false;
    if (!currentGameId) return false;
    return revealed || userId === session?.user?.id;
  };

  const handlePlayerClick = (entry: LeaderboardEntry) => {
    if (!canClickPlayer(entry.userId)) return;
    setSelectedPlayer(entry);
  };

  return (
    <Card variant="surface" padding="lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-h3 text-text-primary">{t("title")}</h2>
        <TypeToggle
          type={type}
          onChange={setType}
          labels={{ weekly: t("thisWeek"), alltime: t("allTime") }}
        />
      </div>

      {/* Round Tabs - only show when in weekly mode and rounds exist */}
      {type === "weekly" && (
        <RoundTabs
          maxRoundNumber={maxRoundNumber}
          selectedRound={selectedRound}
          onSelectRound={setSelectedRound}
          labels={{ total: t("total"), round: t("round") }}
        />
      )}

      <div className={cn(showBlur && "blur-md select-none pointer-events-none transition-all")}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : leaderboard.length === 0 ? (
          <p className="text-text-muted text-center py-8">
            {type === "weekly" ? t("noResultsWeek") : t("noGamesPlayed")}
          </p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, index) => (
              <LeaderboardEntryRow
                key={entry.userId}
                entry={entry}
                index={index}
                isClickable={canClickPlayer(entry.userId)}
                type={type}
                selectedRound={selectedRound}
                currentGameType={currentGameType}
                onClick={() => handlePlayerClick(entry)}
                labels={{
                  notMember: t("notMember"),
                  days: t("days", { count: entry.roundsPlayed }),
                  points: t("points"),
                  game: t("game"),
                  games: t("games"),
                }}
              />
            ))}
          </div>
        )}
      </div>

      {showBlur && (
        <div className="text-center mt-4 py-4 border-t border-glass-border">
          <div className="inline-flex items-center gap-2 text-text-secondary">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span className="text-body-small">{t("revealedByAdmin")}</span>
          </div>
        </div>
      )}

      {/* Player Results Modal */}
      {selectedPlayer && currentGameId && (
        <PlayerResultsModal
          gameId={currentGameId}
          userId={selectedPlayer.userId}
          userName={selectedPlayer.userName}
          userImage={selectedPlayer.userImage}
          roundNumber={selectedRound}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </Card>
  );
}

// Re-export types
export type { LeaderboardProps, LeaderboardEntry, LeaderboardType } from "./types";
