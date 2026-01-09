"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { CountryMap } from "@/components/Map";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { getEffectiveGameType, getGameTypeConfig } from "@/lib/game-types";
import toast from "react-hot-toast";
import { generateHintCircleCenter, getHintCircleRadius } from "@/lib/hint";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { GroupGameBadgeBar } from "../components/GroupGameBadgeBar";
import { RoundSummary } from "../components/RoundSummary";
import type { GameRound, Guess, Game, GuessResult, HintCircle, TimerState } from "../types";

export default function PlayPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  const router = useRouter();
  const routeParams = useParams();
  const locale = routeParams.locale as string;
  const t = useTranslations("play");
  const tCommon = useTranslations("common");

  const [game, setGame] = useState<Game | null>(null);
  const [rounds, setRounds] = useState<GameRound[]>([]);
  const [userGuesses, setUserGuesses] = useState<Guess[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<GuessResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timeExpired, setTimeExpired] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [showRoundSummary, setShowRoundSummary] = useState(false);
  const [hintEnabled, setHintEnabled] = useState(false);
  const [hintCircle, setHintCircle] = useState<HintCircle | null>(null);

  const fetchGameData = useCallback(async () => {
    try {
      const gameRes = await fetch(`/api/games?groupId=${groupId}`);

      if (gameRes.ok) {
        const gameData = await gameRes.json();
        setGame(gameData.game);
        setRounds(gameData.rounds);
        setTimeLimitSeconds(gameData.timeLimitSeconds ?? null);
        setHintEnabled(gameData.hintEnabled ?? false);

        if (gameData.game) {
          const actualGuessesRes = await fetch(`/api/guesses?gameId=${gameData.game.id}`);
          if (actualGuessesRes.ok) {
            const guessesResponse = await actualGuessesRes.json();
            const guessesData = guessesResponse.guesses || [];
            setUserGuesses(guessesData);

            const released = gameData.rounds.filter(
              (r: GameRound) => r.roundNumber <= gameData.game.currentRound
            );

            const playedGameRoundIds = new Set(guessesData.map((g: Guess) => g.gameRoundId));
            const nextUnplayed = released.findIndex((r: GameRound) => !playedGameRoundIds.has(r.id));

            if (nextUnplayed < 0 && released.length > 0) {
              router.push(`/${locale}/groups/${groupId}`);
              return;
            }

            setCurrentRoundIndex(nextUnplayed >= 0 ? nextUnplayed : 0);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching game:", err);
    } finally {
      setLoading(false);
    }
  }, [groupId, locale, router]);

  useEffect(() => {
    fetchGameData();
  }, [fetchGameData]);

  const releasedRounds = rounds.filter((r) => game && r.roundNumber <= game.currentRound);
  const currentRound = releasedRounds[currentRoundIndex];
  const isLocationPlayed = userGuesses.some((g) => g.gameRoundId === currentRound?.id);
  const allReleasedLocationsPlayed = releasedRounds.length > 0 &&
    releasedRounds.every((r) => userGuesses.some((g) => g.gameRoundId === r.id));

  // Generate hint circle when round changes
  useEffect(() => {
    if (loading || !hintEnabled || !currentRound || showResult || isLocationPlayed) {
      setHintCircle(null);
      return;
    }

    const gameType = currentRound.gameType ?? (game ? getEffectiveGameType(game) : "country:switzerland");
    const radiusKm = getHintCircleRadius(gameType);
    const center = generateHintCircleCenter(
      currentRound.latitude,
      currentRound.longitude,
      radiusKm,
      gameType
    );
    setHintCircle({ lat: center.lat, lng: center.lng, radiusKm });
  }, [loading, currentRound, hintEnabled, showResult, isLocationPlayed, game]);

  // Timer effect
  const currentTimeLimit = currentRound?.timeLimitSeconds ?? timeLimitSeconds;

  useEffect(() => {
    if (!currentTimeLimit || showResult || isLocationPlayed || !currentRound || loading) {
      return;
    }

    setTimeExpired(false);
    setTimeRemaining(currentTimeLimit);
    setStartTime(Date.now());

    const timerStartTime = Date.now();
    const timerEndTime = timerStartTime + currentTimeLimit * 1000;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, (timerEndTime - now) / 1000);

      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        setTimeExpired(true);
        toast.error(t("timeUp"));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentRoundIndex, currentTimeLimit, showResult, loading, currentRound, isLocationPlayed, t]);

  const handleGuess = async () => {
    if (!markerPosition || !currentRound || submitting) return;

    setSubmitting(true);
    const timeSeconds = startTime ? Math.round((Date.now() - startTime) / 1000) : null;

    try {
      const response = await fetch("/api/guesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameRoundId: currentRound.id,
          latitude: markerPosition.lat,
          longitude: markerPosition.lng,
          timeSeconds,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLastResult({
          distanceKm: data.distanceKm,
          score: data.score,
          targetLat: data.targetLatitude,
          targetLng: data.targetLongitude,
        });
        setUserGuesses([
          ...userGuesses,
          {
            gameRoundId: currentRound.id,
            distanceKm: data.distanceKm,
            score: data.score,
            roundNumber: currentRound.roundNumber,
            latitude: markerPosition.lat,
            longitude: markerPosition.lng,
          },
        ]);
        setShowResult(true);
      }
    } catch (err) {
      console.error("Error submitting guess:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTimeoutSubmit = async () => {
    if (!currentRound || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/guesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameRoundId: currentRound.id,
          latitude: null,
          longitude: null,
          timeSeconds: timeLimitSeconds,
          timeout: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newGuesses = [
          ...userGuesses,
          {
            gameRoundId: currentRound.id,
            distanceKm: data.distanceKm,
            score: data.score,
            roundNumber: currentRound.roundNumber,
            latitude: null,
            longitude: null,
          },
        ];
        setUserGuesses(newGuesses);

        const nextRoundIndex = currentRoundIndex + 1;
        if (nextRoundIndex >= releasedRounds.length) {
          router.push(`/${locale}/groups/${groupId}`);
          return;
        }

        setMarkerPosition(null);
        setShowResult(false);
        setLastResult(null);
        setTimeExpired(false);
        setTimeRemaining(null);
        setCurrentRoundIndex(nextRoundIndex);
      }
    } catch (err) {
      console.error("Error submitting timeout:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextRound = () => {
    const nextRoundIndex = currentRoundIndex + 1;
    if (nextRoundIndex >= releasedRounds.length) {
      router.push(`/${locale}/groups/${groupId}`);
      return;
    }
    setMarkerPosition(null);
    setShowResult(false);
    setLastResult(null);
    setTimeExpired(false);
    setTimeRemaining(null);
    setCurrentRoundIndex(nextRoundIndex);
  };

  const handleCreateGame = async () => {
    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });

      if (response.ok) {
        fetchGameData();
      } else {
        const data = await response.json();
        toast.error(data.error || t("errorCreating"));
      }
    } catch (err) {
      console.error("Error creating game:", err);
    }
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

  // No game exists
  if (!game) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-glass-border bg-surface-1/80 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
            <Link
              href={`/${locale}/groups/${groupId}`}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">{tCommon("back")}</span>
            </Link>
            <h1 className="text-h3 text-primary">{t("playing")}</h1>
          </div>
        </header>
        <main className="max-w-xl mx-auto px-4 py-8">
          <Card variant="elevated" padding="xl" className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-3 flex items-center justify-center">
              <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-text-secondary mb-6">{t("noActiveGame")}</p>
            <Button variant="primary" size="lg" onClick={handleCreateGame}>
              {t("startNewGame")}
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  // Round complete summary
  if (showRoundSummary && allReleasedLocationsPlayed && releasedRounds.length > 0) {
    return (
      <RoundSummary
        locale={locale}
        groupId={groupId}
        game={game}
        releasedRounds={releasedRounds}
        userGuesses={userGuesses}
        currentRound={currentRound}
      />
    );
  }

  // No current round available
  if (!currentRound && game) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-glass-border bg-surface-1/80 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
            <Link
              href={`/${locale}/groups/${groupId}`}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>{tCommon("back")}</span>
            </Link>
          </div>
        </header>
        <main className="max-w-xl mx-auto px-4 py-8">
          <Card variant="elevated" padding="xl" className="text-center">
            <p className="text-text-secondary mb-4">
              Keine Runde verfügbar. Warte auf die nächste Runde oder gehe zurück zur Gruppe.
            </p>
            <Link href={`/${locale}/groups/${groupId}`}>
              <Button variant="primary">{tCommon("back")}</Button>
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  // Timer state helper
  const getTimerState = (): TimerState => {
    if (!timeRemaining) return "normal";
    if (timeRemaining <= 5) return "critical";
    if (timeRemaining <= 10) return "warning";
    return "normal";
  };

  // Button config helper
  const getButtonConfig = () => {
    if (timeExpired && !showResult) {
      return {
        text: t("next"),
        variant: "accent" as const,
        onClick: handleTimeoutSubmit,
        disabled: false,
      };
    }
    if (showResult) {
      const isLastRound = currentRoundIndex >= releasedRounds.length - 1;
      const resultVariant = lastResult && lastResult.distanceKm < 20 ? "success" : "primary";
      return {
        text: isLastRound ? (allReleasedLocationsPlayed ? t("result") : t("wait")) : t("next"),
        variant: resultVariant as "success" | "primary",
        onClick: () => {
          if (!isLastRound) {
            handleNextRound();
          } else if (allReleasedLocationsPlayed) {
            setShowRoundSummary(true);
          } else {
            router.push(`/${locale}/groups/${groupId}`);
          }
        },
        disabled: false,
      };
    }
    return {
      text: markerPosition ? t("submit") : t("placeMarker"),
      variant: "primary" as const,
      onClick: handleGuess,
      disabled: !markerPosition,
    };
  };

  const mapGameType = currentRound?.gameType ?? (game ? getEffectiveGameType(game) : undefined);

  return (
    <div className="h-[calc(100dvh-52px)] max-w-[1440px] mx-auto relative">
      {/* Fullscreen Map */}
      <CountryMap
        gameType={mapGameType}
        country={currentRound?.country ?? game?.country ?? DEFAULT_COUNTRY}
        onMarkerPlace={showResult || timeExpired ? undefined : setMarkerPosition}
        markerPosition={markerPosition}
        targetPosition={
          showResult && lastResult
            ? { lat: lastResult.targetLat, lng: lastResult.targetLng }
            : null
        }
        showTarget={showResult}
        interactive={!showResult && !isLocationPlayed && !timeExpired}
        height="100%"
        hintCircle={!showResult && !isLocationPlayed ? hintCircle : null}
      />

      {/* Badge Bar */}
      {currentRound && (
        <GroupGameBadgeBar
          currentRound={currentRound}
          showResult={showResult}
          timeExpired={timeExpired}
          timerState={getTimerState()}
          timeRemaining={timeRemaining}
          currentTimeLimit={currentTimeLimit}
          lastResult={lastResult}
          buttonConfig={getButtonConfig()}
          submitting={submitting}
        />
      )}
    </div>
  );
}
