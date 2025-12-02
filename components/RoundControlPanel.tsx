"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/Button";
import WinnerCelebration from "@/components/WinnerCelebration";
import { getGameTypesByType, getGameTypeName } from "@/lib/game-types";
import { cn } from "@/lib/utils";

interface Winner {
  userName: string;
  userImage: string | null;
  totalDistance: number;
}

interface RoundControlPanelProps {
  gameId: string;
  groupId: string;
  currentRound: number;
  locationsPerRound?: number;
  isAdmin: boolean;
  userCompletedRounds?: number;
  gameStatus: "active" | "completed";
  gameName?: string;
  currentGameType: string;
}

export default function RoundControlPanel({
  gameId,
  groupId,
  currentRound,
  locationsPerRound: defaultLocationsPerRound = 5,
  isAdmin,
  gameStatus,
  gameName,
  currentGameType,
}: RoundControlPanelProps) {
  const router = useRouter();
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [winner, setWinner] = useState<Winner | null>(null);
  const [selectedGameType, setSelectedGameType] = useState(currentGameType);
  const [selectedLocationsPerRound, setSelectedLocationsPerRound] = useState(defaultLocationsPerRound);
  const t = useTranslations("game");
  const tCommon = useTranslations("common");
  const tNewGroup = useTranslations("newGroup");

  const { country: countryGameTypes, world: worldGameTypes } = getGameTypesByType();
  const locationOptions = [3, 5, 10];

  const handleReleaseRound = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/games/release-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, gameType: selectedGameType, locationsPerRound: selectedLocationsPerRound }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("errorReleasing"));
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("unknownError"));
    } finally {
      setLoading(false);
    }
  };

  const fetchWinner = async () => {
    try {
      const res = await fetch(`/api/leaderboard?groupId=${groupId}&gameId=${gameId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.leaderboard && data.leaderboard.length > 0) {
          const firstPlace = data.leaderboard[0];
          return {
            userName: firstPlace.userName,
            userImage: firstPlace.userImage,
            totalDistance: firstPlace.totalDistance,
          };
        }
      }
    } catch (error) {
      console.error("Failed to fetch winner:", error);
    }
    return null;
  };

  const completeGame = async () => {
    setCompleting(true);
    setError("");

    try {
      const response = await fetch("/api/games/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("errorCompleting"));
      }

      // Fetch winner and show celebration
      const winnerData = await fetchWinner();
      if (winnerData) {
        setWinner(winnerData);
        setShowCelebration(true);
      } else {
        // No winner data, just show success and refresh
        toast.success(t("gameCompleted"));
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("unknownError"));
    } finally {
      setCompleting(false);
    }
  };

  const handleCompleteGame = () => {
    toast(
      (toastObj) => (
        <div className="text-center">
          <p className="font-medium text-text-primary mb-2">
            {t("confirmComplete")}
          </p>
          <p className="text-sm text-text-secondary mb-4">{t("completeInfo")}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                toast.dismiss(toastObj.id);
                completeGame();
              }}
              className="bg-error text-white px-4 py-2 rounded-lg hover:bg-error/90 transition-colors"
            >
              {tCommon("ok")}
            </button>
            <button
              onClick={() => toast.dismiss(toastObj.id)}
              className="bg-surface-3 text-text-secondary px-4 py-2 rounded-lg hover:bg-surface-2 transition-colors"
            >
              {tCommon("cancel")}
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };

  // Show celebration overlay
  if (showCelebration && winner) {
    return (
      <WinnerCelebration
        winner={winner}
        groupId={groupId}
        gameName={gameName}
        onClose={() => {
          setShowCelebration(false);
          router.refresh();
        }}
      />
    );
  }

  // Don't render if not admin
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Admin controls */}
      {gameStatus === "active" && (
        <div className="space-y-4">
          {error && (
            <p className="text-error text-body-small text-center">{error}</p>
          )}

          {/* Game Type Selection for next round */}
          <div className="space-y-2">
            <label className="block text-body-small font-medium text-text-primary text-center">
              {t("selectGameType")}
            </label>

            {/* Country Game Types */}
            <div className="space-y-1">
              <span className="text-xs text-text-muted">{t("countries")}</span>
              <div className="flex gap-2">
                {countryGameTypes.map((gameType) => (
                  <button
                    key={gameType.id}
                    type="button"
                    onClick={() => setSelectedGameType(gameType.id)}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg border-2 font-medium transition-all text-sm flex items-center justify-center gap-1",
                      selectedGameType === gameType.id
                        ? "border-success bg-success/10 text-success"
                        : "border-glass-border bg-surface-2 text-text-secondary hover:border-success/50"
                    )}
                  >
                    <span>{gameType.icon}</span>
                    <span>{getGameTypeName(gameType.id, locale)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* World Game Types */}
            <div className="space-y-1">
              <span className="text-xs text-text-muted">{t("worldQuizzes")}</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {worldGameTypes.map((gameType) => (
                  <button
                    key={gameType.id}
                    type="button"
                    onClick={() => setSelectedGameType(gameType.id)}
                    className={cn(
                      "py-2 px-3 rounded-lg border-2 font-medium transition-all text-sm flex items-center justify-center gap-1",
                      selectedGameType === gameType.id
                        ? "border-success bg-success/10 text-success"
                        : "border-glass-border bg-surface-2 text-text-secondary hover:border-success/50"
                    )}
                  >
                    <span>{gameType.icon}</span>
                    <span>{getGameTypeName(gameType.id, locale)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Locations per Round */}
          <div className="space-y-2">
            <label className="block text-body-small font-medium text-text-primary text-center">
              {tNewGroup("locationsPerRound")}
            </label>
            <div className="flex gap-2 justify-center">
              {locationOptions.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setSelectedLocationsPerRound(count)}
                  className={cn(
                    "w-12 py-2 rounded-lg border-2 font-medium transition-all text-sm",
                    selectedLocationsPerRound === count
                      ? "border-success bg-success/10 text-success"
                      : "border-glass-border bg-surface-2 text-text-secondary hover:border-success/50"
                  )}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 justify-center">
            <Button
              variant="success"
              size="sm"
              onClick={handleReleaseRound}
              disabled={loading || completing}
              isLoading={loading}
            >
              {loading ? t("releasing") : t("releaseRound", { number: currentRound + 1 })}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleCompleteGame}
              disabled={loading || completing}
              isLoading={completing}
            >
              {completing ? t("completing") : t("completeGame")}
            </Button>
          </div>
        </div>
      )}

      {/* Game completed message */}
      {gameStatus === "completed" && (
        <p className="text-center text-success font-medium text-body-small">
          {t("gameCompleted")}
        </p>
      )}
    </div>
  );
}
