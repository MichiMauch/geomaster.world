"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import WinnerCelebration from "@/components/WinnerCelebration";
import { getGameTypesByTypeExtended } from "@/lib/game-types";
import { OptionButton } from "./OptionButton";
import { GameTypeSection } from "./GameTypeSection";
import { LOCATION_OPTIONS, TIME_OPTIONS } from "./constants";
import { logger } from "@/lib/logger";
import type { RoundControlPanelProps, Winner } from "./types";

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
  const [selectedTimePerRound, setSelectedTimePerRound] = useState(60);
  const t = useTranslations("game");
  const tCommon = useTranslations("common");
  const tNewGroup = useTranslations("newGroup");
  const tGroup = useTranslations("group");

  const { country: countryGameTypes, world: worldGameTypes, image: imageGameTypes } = getGameTypesByTypeExtended();

  const handleReleaseRound = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/games/release-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId,
          gameType: selectedGameType,
          locationsPerRound: selectedLocationsPerRound,
          timePerRound: selectedTimePerRound || null,
        }),
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
      logger.error("Failed to fetch winner", error);
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

      const winnerData = await fetchWinner();
      if (winnerData) {
        setWinner(winnerData);
        setShowCelebration(true);
      } else {
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
          <p className="font-medium text-text-primary mb-2">{t("confirmComplete")}</p>
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
    <Card variant="surface" padding="lg">
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

            <GameTypeSection
              label={t("countries")}
              gameTypes={countryGameTypes}
              selectedGameType={selectedGameType}
              onSelect={setSelectedGameType}
              locale={locale}
            />

            <GameTypeSection
              label={t("worldQuizzes")}
              gameTypes={worldGameTypes}
              selectedGameType={selectedGameType}
              onSelect={setSelectedGameType}
              locale={locale}
              layout="grid"
            />

            <GameTypeSection
              label={t("imageMaps")}
              gameTypes={imageGameTypes}
              selectedGameType={selectedGameType}
              onSelect={setSelectedGameType}
              locale={locale}
            />
          </div>

          {/* Locations per Round */}
          <div className="space-y-2">
            <label className="block text-body-small font-medium text-text-primary text-center">
              {tNewGroup("locationsPerRound")}
            </label>
            <div className="flex gap-2 justify-center">
              {LOCATION_OPTIONS.map((count) => (
                <OptionButton
                  key={count}
                  selected={selectedLocationsPerRound === count}
                  onClick={() => setSelectedLocationsPerRound(count)}
                  className="w-12"
                >
                  {count}
                </OptionButton>
              ))}
            </div>
          </div>

          {/* Time per Round */}
          <div className="space-y-2">
            <label className="block text-body-small font-medium text-text-primary text-center">
              {tGroup("timeLimit")}
            </label>
            <div className="flex gap-2 justify-center">
              {TIME_OPTIONS.map((seconds) => (
                <OptionButton
                  key={seconds}
                  selected={selectedTimePerRound === seconds}
                  onClick={() => setSelectedTimePerRound(seconds)}
                >
                  {seconds === 0 ? tGroup("noTimeLimit") : `${seconds}s`}
                </OptionButton>
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
    </Card>
  );
}

// Re-export types
export type { RoundControlPanelProps, Winner } from "./types";
