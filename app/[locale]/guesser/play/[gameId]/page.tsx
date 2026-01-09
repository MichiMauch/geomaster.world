"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { CountryMap, PanoramaMap } from "@/components/Map";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { getEffectiveGameType, getGameTypeConfig, isPanoramaGameType } from "@/lib/game-types";
import { calculateDistance, calculatePixelDistance } from "@/lib/distance";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { isCountryQuizGameType } from "@/components/country-quiz/QuestionDisplay";
import { LevelUpCelebration } from "@/components/LevelUpCelebration";
import { useGameData } from "../hooks/useGameData";
import { useGameTimer } from "../hooks/useGameTimer";
import { GameBadgeBar } from "../components/GameBadgeBar";
import { calculateClientScore } from "../utils/scoring";
import type { GuessResult, LevelUpInfo, Guess } from "../types";

export default function GuesserPlayPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);
  const router = useRouter();
  const routeParams = useParams();
  const locale = routeParams.locale as string;
  const t = useTranslations("play");
  const tCommon = useTranslations("common");
  const tRanked = useTranslations("ranked");

  // Game data hook
  const {
    game,
    rounds,
    userGuesses,
    dynamicCountry,
    dynamicWorldQuiz,
    loading,
    isGuest,
    guestId,
    addGuess,
  } = useGameData({ gameId, locale });

  // Local state
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<GuessResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [levelUpData, setLevelUpData] = useState<LevelUpInfo | null>(null);

  const currentRound = rounds[currentRoundIndex];

  // Timer hook
  const handleTimeout = useCallback(async () => {
    if (!currentRound || submitting) return;

    setSubmitting(true);

    // For guests: handle timeout client-side
    if (isGuest) {
      const gameType = currentRound.gameType || (game ? getEffectiveGameType(game) : "country:switzerland");
      const config = getGameTypeConfig(gameType);
      const timeoutDistance = config.timeoutPenalty;

      setLastResult({
        distanceKm: timeoutDistance,
        score: 0,
        targetLat: currentRound.latitude,
        targetLng: currentRound.longitude,
      });
      addGuess({
        gameRoundId: currentRound.id,
        distanceKm: timeoutDistance,
        score: 0,
        roundNumber: currentRound.roundNumber,
        latitude: null,
        longitude: null,
      });
      setShowResult(true);
      setSubmitting(false);
      return;
    }

    // For logged-in users: use API
    try {
      const response = await fetch("/api/guesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameRoundId: currentRound.id,
          timeout: true,
          timeSeconds: getCurrentTimeLimit(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLastResult({
          distanceKm: data.distanceKm,
          score: 0,
          targetLat: data.targetLatitude,
          targetLng: data.targetLongitude,
        });
        addGuess({
          gameRoundId: currentRound.id,
          distanceKm: data.distanceKm,
          score: 0,
          roundNumber: currentRound.roundNumber,
          latitude: null,
          longitude: null,
        });
        setShowResult(true);
      }
    } catch (err) {
      console.error("Error submitting timeout:", err);
    } finally {
      setSubmitting(false);
    }
  }, [currentRound, submitting, isGuest, game, addGuess]);

  const {
    timeRemaining,
    getCurrentTimeLimit,
    stopTimer,
    resetTimer,
    getTimerColor,
  } = useGameTimer({
    currentRound,
    game,
    userGuesses,
    showResult,
    loading,
    onTimeout: handleTimeout,
  });

  const totalScore = userGuesses.reduce((sum, g) => sum + g.score, 0);

  const handleGuess = async () => {
    if (!markerPosition || !currentRound || submitting) return;

    stopTimer();
    setSubmitting(true);

    const timeUsed = getCurrentTimeLimit() - timeRemaining;
    const gameType = currentRound.gameType || (game ? getEffectiveGameType(game) : "country:switzerland");
    const isImageGame = gameType.startsWith("image:");

    // For guests: handle guess client-side
    if (isGuest) {
      const distanceKm = isImageGame
        ? calculatePixelDistance(
            markerPosition.lat,
            markerPosition.lng,
            currentRound.latitude,
            currentRound.longitude
          )
        : calculateDistance(
            markerPosition.lat,
            markerPosition.lng,
            currentRound.latitude,
            currentRound.longitude
          );

      const score = calculateClientScore(distanceKm, timeUsed, gameType);

      setLastResult({
        distanceKm,
        score,
        targetLat: currentRound.latitude,
        targetLng: currentRound.longitude,
      });
      addGuess({
        gameRoundId: currentRound.id,
        distanceKm,
        score,
        roundNumber: currentRound.roundNumber,
        latitude: markerPosition.lat,
        longitude: markerPosition.lng,
      });
      setShowResult(true);
      setSubmitting(false);
      return;
    }

    // For logged-in users: use API
    try {
      const response = await fetch("/api/guesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameRoundId: currentRound.id,
          latitude: markerPosition.lat,
          longitude: markerPosition.lng,
          timeSeconds: timeUsed,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLastResult({
          distanceKm: data.distanceKm,
          score: data.score,
          targetLat: data.targetLatitude,
          targetLng: data.targetLongitude,
          insideCountry: data.insideCountry,
          targetCountryCode: data.targetCountryCode,
        });
        addGuess({
          gameRoundId: currentRound.id,
          distanceKm: data.distanceKm,
          score: data.score,
          roundNumber: currentRound.roundNumber,
          latitude: markerPosition.lat,
          longitude: markerPosition.lng,
        });
        setShowResult(true);
      }
    } catch (err) {
      console.error("Error submitting guess:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextRound = () => {
    const nextRoundIndex = currentRoundIndex + 1;
    if (nextRoundIndex >= rounds.length) {
      handleCompleteGame();
      return;
    }
    setMarkerPosition(null);
    setShowResult(false);
    setLastResult(null);
    setCurrentRoundIndex(nextRoundIndex);
    resetTimer(rounds[nextRoundIndex]);
  };

  const handleCompleteGame = async () => {
    setSubmitting(true);

    // For guests: redirect with score in URL
    if (isGuest) {
      const gameType = game?.gameType || (game ? getEffectiveGameType(game) : "country:switzerland");
      router.push(`/${locale}/guesser/results/${gameId}?guestScore=${totalScore}&gameType=${encodeURIComponent(gameType)}`);
      return;
    }

    // For logged-in users: use API
    try {
      const response = await fetch("/api/ranked/games/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
        },
        body: JSON.stringify({ gameId, guestId }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.levelUp?.leveledUp) {
          setLevelUpData({
            newLevel: data.levelUp.newLevel,
            newLevelName: data.levelUp.newLevelName,
          });
          setSubmitting(false);
          return;
        }

        router.push(`/${locale}/guesser/results/${gameId}`);
      } else {
        const error = await response.json();
        console.error("Failed to complete game:", error);
        alert("Fehler beim Speichern der Ergebnisse. Bitte versuche es erneut.");
      }
    } catch (err) {
      console.error("Error completing game:", err);
      alert("Fehler beim Speichern der Ergebnisse. Bitte versuche es erneut.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLevelUpClose = () => {
    setLevelUpData(null);
    router.push(`/${locale}/guesser/results/${gameId}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-secondary">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  // No game or no current round
  if (!game || !currentRound) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-xl mx-auto px-4 py-8">
          <Card variant="elevated" padding="xl" className="text-center">
            <p className="text-text-secondary mb-4">{tRanked("noActiveGame", { defaultValue: "Kein aktives Spiel gefunden" })}</p>
            <Link href={`/${locale}/guesser`}>
              <Button variant="primary">{tCommon("back")}</Button>
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  // Button config helper
  const getButtonConfig = () => {
    if (showResult) {
      const isLastRound = currentRoundIndex >= rounds.length - 1;
      const currentGameType = currentRound?.gameType;
      const isCountryQuiz = isCountryQuizGameType(currentGameType);
      const isSuccess = isCountryQuiz
        ? lastResult?.insideCountry === true
        : lastResult && lastResult.distanceKm < 20;
      const resultVariant = isSuccess ? "success" : "primary";
      return {
        text: isLastRound ? t("finish", { defaultValue: "Beenden" }) : t("next", { defaultValue: "Weiter" }),
        variant: resultVariant as "success" | "primary",
        onClick: handleNextRound,
        disabled: false,
      };
    }
    return {
      text: markerPosition ? t("submit", { defaultValue: "Senden" }) : t("setMarker", { defaultValue: "Marker setzen" }),
      variant: "primary" as const,
      onClick: handleGuess,
      disabled: !markerPosition,
    };
  };

  const isPanorama = isPanoramaGameType(currentRound?.gameType || game?.gameType);

  return (
    <div className="h-dvh max-w-[1440px] mx-auto relative">
      {/* Subtle corner glows */}
      <div className="pointer-events-none absolute inset-0 z-[1]">
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent/5 blur-3xl rounded-full translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Fullscreen Map */}
      {isPanorama && currentRound?.mapillaryImageKey ? (
        <PanoramaMap
          mapillaryImageKey={currentRound.mapillaryImageKey}
          heading={currentRound.heading ?? undefined}
          pitch={currentRound.pitch ?? undefined}
          onMarkerPlace={showResult ? undefined : setMarkerPosition}
          markerPosition={markerPosition}
          targetPosition={
            showResult && lastResult
              ? { lat: lastResult.targetLat, lng: lastResult.targetLng }
              : null
          }
          showTarget={showResult}
          interactive={!showResult}
          height="100%"
        />
      ) : (
        <CountryMap
          gameType={currentRound?.gameType || (game ? getEffectiveGameType(game) : undefined)}
          country={currentRound?.country ?? game?.country ?? DEFAULT_COUNTRY}
          dynamicCountry={dynamicCountry ?? undefined}
          dynamicWorldQuiz={dynamicWorldQuiz ?? undefined}
          onMarkerPlace={showResult ? undefined : setMarkerPosition}
          markerPosition={markerPosition}
          targetPosition={
            showResult && lastResult
              ? { lat: lastResult.targetLat, lng: lastResult.targetLng }
              : null
          }
          showTarget={showResult}
          interactive={!showResult}
          height="100%"
        />
      )}

      {/* Badge Bar */}
      {currentRound && (
        <GameBadgeBar
          currentRound={currentRound}
          locale={locale}
          isPanorama={isPanorama}
          showResult={showResult}
          lastResult={lastResult}
          timeRemaining={timeRemaining}
          getTimerColor={getTimerColor}
          buttonConfig={getButtonConfig()}
          submitting={submitting}
        />
      )}

      {/* Progress indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500]">
        <div className="bg-surface-1/90 backdrop-blur-sm rounded-full px-4 py-1.5 border border-surface-3 shadow-lg">
          <span className="text-sm text-text-muted font-mono tabular-nums">
            {currentRoundIndex + 1} / 5
          </span>
        </div>
      </div>

      {/* Level Up Celebration */}
      <LevelUpCelebration
        isOpen={!!levelUpData}
        onClose={handleLevelUpClose}
        newLevel={levelUpData?.newLevel ?? 1}
        newLevelName={levelUpData?.newLevelName ?? ""}
        locale={locale}
      />
    </div>
  );
}
