"use client";

import { useEffect, useState, memo } from "react";
import { RefreshCw, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import {
  useGamesAdmin,
  type GameWithDetails,
  type GameRoundWithGuesses,
  type GuessWithScoring,
} from "../hooks/useGamesAdmin";

// Scoring version badge colors
const VERSION_BADGES: Record<number, { variant: "default" | "primary" | "warning"; label: string }> = {
  1: { variant: "default", label: "v1" },
  2: { variant: "primary", label: "v2" },
  3: { variant: "warning", label: "v3" },
};

// Mode labels
const MODE_LABELS: Record<string, string> = {
  ranked: "Ranked",
  training: "Training",
  group: "Gruppe",
};

// Status badges
const STATUS_BADGES: Record<string, { variant: "success" | "warning"; label: string }> = {
  completed: { variant: "success", label: "Fertig" },
  active: { variant: "warning", label: "Aktiv" },
};

export function GamesTab() {
  const {
    games,
    filters,
    pagination,
    loading,
    setFilters,
    setPage,
    fetchGames,
    refresh,
  } = useGamesAdmin();

  // Fetch on mount and when page/filters change
  useEffect(() => {
    fetchGames();
  }, [pagination.page, fetchGames]);

  const handleFilterChange = (key: string, value: string | undefined) => {
    setFilters({ ...filters, [key]: value || undefined });
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return date.toLocaleString("de-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatGameType = (gameType: string | null) => {
    if (!gameType) return "-";
    // Remove prefix for display
    return gameType.replace(/^(country|world|image|panorama):/, "");
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card variant="surface" padding="md">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Mode Filter */}
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Modus</label>
            <select
              value={filters.mode || ""}
              onChange={(e) => handleFilterChange("mode", e.target.value)}
              className="bg-surface-2 border border-glass-border rounded px-3 py-2 text-sm"
            >
              <option value="">Alle</option>
              <option value="ranked">Ranked</option>
              <option value="training">Training</option>
              <option value="group">Gruppe</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Status</label>
            <select
              value={filters.status || ""}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="bg-surface-2 border border-glass-border rounded px-3 py-2 text-sm"
            >
              <option value="">Alle</option>
              <option value="completed">Fertig</option>
              <option value="active">Aktiv</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Von</label>
            <input
              type="date"
              value={filters.startDate || ""}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="bg-surface-2 border border-glass-border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Bis</label>
            <input
              type="date"
              value={filters.endDate || ""}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="bg-surface-2 border border-glass-border rounded px-3 py-2 text-sm"
            />
          </div>

          {/* Refresh */}
          <Button variant="secondary" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </Card>

      {/* Games Table */}
      <Card variant="surface" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2">
              <tr>
                <th className="text-left p-3 font-medium w-8"></th>
                <th className="text-left p-3 font-medium">Zeit</th>
                <th className="text-left p-3 font-medium">Typ</th>
                <th className="text-left p-3 font-medium">Modus</th>
                <th className="text-left p-3 font-medium">Spieler/Gruppe</th>
                <th className="text-left p-3 font-medium">Scoring</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Runden</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Laden...
                  </td>
                </tr>
              ) : games.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Keine Spiele gefunden
                  </td>
                </tr>
              ) : (
                games.map((game) => (
                  <GameRow
                    key={game.id}
                    game={game}
                    formatTimestamp={formatTimestamp}
                    formatGameType={formatGameType}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-glass-border">
            <span className="text-sm text-muted-foreground">
              Seite {pagination.page} von {pagination.totalPages} ({pagination.total} Spiele)
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// Game row component with expansion
const GameRow = memo(function GameRow({
  game,
  formatTimestamp,
  formatGameType,
}: {
  game: GameWithDetails;
  formatTimestamp: (ts: string | null) => string;
  formatGameType: (gt: string | null) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const versionBadge = VERSION_BADGES[game.scoringVersion] || VERSION_BADGES[2];
  const statusBadge = STATUS_BADGES[game.status] || STATUS_BADGES.active;
  const modeLabel = MODE_LABELS[game.mode] || game.mode;

  // Count total guesses
  const totalGuesses = game.rounds.reduce((sum, r) => sum + r.guesses.length, 0);

  return (
    <>
      <tr
        className="hover:bg-surface-2/50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="p-3">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </td>
        <td className="p-3 whitespace-nowrap text-muted-foreground">
          {formatTimestamp(game.createdAt)}
        </td>
        <td className="p-3 font-medium">{formatGameType(game.gameType)}</td>
        <td className="p-3">
          <span className="text-muted-foreground">{modeLabel}</span>
        </td>
        <td className="p-3">
          {game.userName ? (
            <div className="flex items-center gap-2">
              <Avatar src={game.userImage} name={game.userName} size="sm" />
              <span className="truncate max-w-[100px]">{game.userName}</span>
            </div>
          ) : game.groupName ? (
            <span className="text-muted-foreground">{game.groupName}</span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </td>
        <td className="p-3">
          <Badge variant={versionBadge.variant}>{versionBadge.label}</Badge>
        </td>
        <td className="p-3">
          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
        </td>
        <td className="p-3 text-muted-foreground">
          {game.rounds.length} ({totalGuesses} Guesses)
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} className="p-0">
            <RoundDetails rounds={game.rounds} scoringVersion={game.scoringVersion} />
          </td>
        </tr>
      )}
    </>
  );
});

// Round details component
function RoundDetails({
  rounds,
  scoringVersion,
}: {
  rounds: GameRoundWithGuesses[];
  scoringVersion: number;
}) {
  if (rounds.length === 0) {
    return (
      <div className="p-4 bg-surface-2 text-muted-foreground text-center">
        Keine Runden vorhanden
      </div>
    );
  }

  return (
    <div className="bg-surface-2 p-4 space-y-4">
      {rounds.map((round) => (
        <div key={round.id} className="bg-background rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium">
              Runde {round.roundNumber}
              {round.locationIndex > 0 && `.${round.locationIndex + 1}`}
            </span>
            <span className="text-muted-foreground">-</span>
            <span className="text-primary">{round.locationName}</span>
          </div>

          {round.guesses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Guesses</p>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-surface-3">
                <tr>
                  <th className="text-left p-2 font-medium">Spieler</th>
                  <th className="text-right p-2 font-medium">Distanz</th>
                  <th className="text-right p-2 font-medium">Zeit</th>
                  <th className="text-right p-2 font-medium">Basis-Score</th>
                  <th className="text-right p-2 font-medium">Zeit-Mult</th>
                  <th className="text-right p-2 font-medium">Final-Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {round.guesses.map((guess) => (
                  <GuessRow key={guess.id} guess={guess} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}

      {/* Scoring formula explanation */}
      <div className="text-xs text-muted-foreground bg-background rounded p-2">
        <strong>Scoring v{scoringVersion}:</strong>{" "}
        {scoringVersion === 1 && "Final = 100 × e^(-Distanz/ScaleFactor)"}
        {scoringVersion === 2 && "Final = Basis-Score × Zeit-Multiplikator"}
        {scoringVersion === 3 && "Final = (100 bei Treffer, sonst Distanz) × Zeit-Mult"}
        {" | "}
        <strong>Zeit-Multiplikator:</strong> 1 + min(2, 3/(Zeit+0.1))
      </div>
    </div>
  );
}

// Individual guess row
function GuessRow({ guess }: { guess: GuessWithScoring }) {
  return (
    <tr className="hover:bg-surface-2/30">
      <td className="p-2">
        {guess.userName ? (
          <div className="flex items-center gap-2">
            <Avatar src={guess.userImage} name={guess.userName} size="sm" />
            <span className="truncate max-w-[80px]">{guess.userName}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      <td className="p-2 text-right font-mono">
        {guess.distanceKm.toFixed(2)} km
      </td>
      <td className="p-2 text-right font-mono">
        {guess.timeSeconds !== null ? `${guess.timeSeconds.toFixed(1)}s` : "-"}
      </td>
      <td className="p-2 text-right font-mono">{guess.baseScore}</td>
      <td className="p-2 text-right font-mono">{guess.timeMultiplier.toFixed(2)}x</td>
      <td className="p-2 text-right font-mono font-bold text-primary">
        {guess.calculatedScore}
      </td>
    </tr>
  );
}
