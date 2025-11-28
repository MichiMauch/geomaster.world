"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import SwitzerlandMap from "@/components/Map";
import toast from "react-hot-toast";
import { generateHintCircleCenter, HINT_CIRCLE_RADIUS_KM } from "@/lib/hint";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RoundHeader } from "@/components/game/RoundHeader";
import { ActionBar } from "@/components/game/ActionBar";
import { ScorePopup, RoundCompletePopup } from "@/components/game/ScorePopup";
import { cn } from "@/lib/utils";

interface GameRound {
  id: string;
  roundNumber: number;
  locationIndex: number;
  locationId: string;
  locationName: string;
  latitude: number;
  longitude: number;
}

interface Guess {
  gameRoundId: string;
  distanceKm: number;
  roundNumber: number;
}

interface Game {
  id: string;
  weekNumber: number;
  year: number;
  status: string;
  currentRound: number;
}

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
  const [markerPosition, setMarkerPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{
    distanceKm: number;
    targetLat: number;
    targetLng: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timeExpired, setTimeExpired] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [showRoundSummary, setShowRoundSummary] = useState(false);
  const [hintEnabled, setHintEnabled] = useState(false);
  const [hintCircle, setHintCircle] = useState<{ lat: number; lng: number; radiusKm: number } | null>(null);

  const fetchGameData = useCallback(async () => {
    try {
      const [gameRes, guessesRes] = await Promise.all([
        fetch(`/api/games?groupId=${groupId}`),
        fetch(`/api/guesses?gameId=temp`),
      ]);

      if (gameRes.ok) {
        const gameData = await gameRes.json();
        setGame(gameData.game);
        setRounds(gameData.rounds);
        setTimeLimitSeconds(gameData.timeLimitSeconds ?? null);
        setHintEnabled(gameData.hintEnabled ?? false);

        if (gameData.game) {
          const actualGuessesRes = await fetch(
            `/api/guesses?gameId=${gameData.game.id}`
          );
          if (actualGuessesRes.ok) {
            const guessesData = await actualGuessesRes.json();
            setUserGuesses(guessesData);

            const released = gameData.rounds.filter(
              (r: GameRound) => r.roundNumber <= gameData.game.currentRound
            );

            const playedGameRoundIds = new Set(
              guessesData.map((g: Guess) => g.gameRoundId)
            );
            const nextUnplayed = released.findIndex(
              (r: GameRound) => !playedGameRoundIds.has(r.id)
            );

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
  const isLocationPlayed = userGuesses.some(
    (g) => g.gameRoundId === currentRound?.id
  );
  const allReleasedLocationsPlayed = releasedRounds.length > 0 &&
    releasedRounds.every((r) => userGuesses.some((g) => g.gameRoundId === r.id));
  const totalDistance = userGuesses.reduce((sum, g) => sum + g.distanceKm, 0);

  // Generate hint circle when round changes
  useEffect(() => {
    if (!hintEnabled || !currentRound || showResult || isLocationPlayed) {
      setHintCircle(null);
      return;
    }

    const center = generateHintCircleCenter(
      currentRound.latitude,
      currentRound.longitude,
      HINT_CIRCLE_RADIUS_KM
    );
    setHintCircle({
      lat: center.lat,
      lng: center.lng,
      radiusKm: HINT_CIRCLE_RADIUS_KM,
    });
  }, [currentRound?.id, hintEnabled, showResult, isLocationPlayed]);

  // Timer effect
  useEffect(() => {
    if (!timeLimitSeconds || showResult || isLocationPlayed || !currentRound || loading) {
      return;
    }

    setTimeExpired(false);
    setTimeRemaining(timeLimitSeconds);
    setStartTime(Date.now());

    const timerStartTime = Date.now();
    const timerEndTime = timerStartTime + timeLimitSeconds * 1000;

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
  }, [currentRoundIndex, timeLimitSeconds, showResult, loading, currentRound, isLocationPlayed, t]);

  const handleGuess = async () => {
    if (!markerPosition || !currentRound || submitting) return;

    setSubmitting(true);
    const timeSeconds = startTime
      ? Math.round((Date.now() - startTime) / 1000)
      : null;

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
          targetLat: data.targetLatitude,
          targetLng: data.targetLongitude,
        });
        setUserGuesses([
          ...userGuesses,
          {
            gameRoundId: currentRound.id,
            distanceKm: data.distanceKm,
            roundNumber: currentRound.roundNumber,
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
        const newGuesses = [
          ...userGuesses,
          {
            gameRoundId: currentRound.id,
            distanceKm: 400,
            roundNumber: currentRound.roundNumber,
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
    const completedRoundNumber = game.currentRound;
    const currentRoundLocations = releasedRounds.filter(
      (r) => r.roundNumber === completedRoundNumber
    );
    const currentRoundGuesses = userGuesses.filter((g) =>
      currentRoundLocations.some((loc) => loc.id === g.gameRoundId)
    );
    const currentRoundDistance = currentRoundGuesses.reduce(
      (sum, g) => sum + g.distanceKm,
      0
    );

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
            <h1 className="text-h3 text-primary">{t("result")}</h1>
          </div>
        </header>
        <main className="max-w-xl mx-auto px-4 py-8">
          <Card variant="elevated" padding="xl" className="text-center space-y-6">
            <div className="space-y-2">
              <span className="text-5xl">🎉</span>
              <h2 className="text-h1 text-text-primary">
                {t("roundComplete", { number: completedRoundNumber })}
              </h2>
              <p className="text-text-secondary">
                {t("week", { number: game.weekNumber })}/{game.year}
              </p>
            </div>

            <div className="py-6 rounded-xl bg-surface-2">
              <p className="text-caption text-text-muted mb-1">{t("totalDistance")}</p>
              <p className="text-display font-bold text-accent tabular-nums">
                {currentRoundDistance.toFixed(1)} km
              </p>
            </div>

            <div className="space-y-2">
              {currentRoundGuesses.map((guess) => {
                const location = currentRoundLocations.find(
                  (r) => r.id === guess.gameRoundId
                );
                return (
                  <div
                    key={guess.gameRoundId}
                    className="flex justify-between items-center p-3 rounded-xl bg-surface-2"
                  >
                    <span className="text-text-secondary">{location?.locationName}</span>
                    <span
                      className={cn(
                        "font-medium tabular-nums",
                        guess.distanceKm < 10
                          ? "text-success"
                          : guess.distanceKm < 30
                          ? "text-accent"
                          : "text-error"
                      )}
                    >
                      {guess.distanceKm.toFixed(1)} km
                    </span>
                  </div>
                );
              })}
            </div>

            <Link href={`/${locale}/groups/${groupId}`}>
              <Button variant="primary" size="lg" fullWidth>
                {t("toLeaderboard")}
              </Button>
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  // Calculate round info
  const locationsInCurrentRound = currentRound
    ? releasedRounds.filter((r) => r.roundNumber === currentRound.roundNumber)
    : [];
  const positionInRound = currentRound
    ? locationsInCurrentRound.findIndex((r) => r.id === currentRound.id) + 1
    : 0;

  // Debug: if no current round, show message
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

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Back button - klein oben links */}
      <div className="px-3 py-2">
        <Link
          href={`/${locale}/groups/${groupId}`}
          className="text-text-muted hover:text-text-primary text-sm"
        >
          ← {tCommon("back")}
        </Link>
      </div>

      {/* Zentrierter Block: Ort + Timer + Button */}
      {currentRound && (
        <div className="flex flex-col items-center py-4 bg-surface-1 border-b border-glass-border">
          {/* Ortsname */}
          <h1 className="text-4xl font-bold text-text-primary">
            {currentRound.locationName}
          </h1>

          {/* Timer - gleich gross wie Ortsname */}
          {timeLimitSeconds && !showResult && !isLocationPlayed && !timeExpired && (
            <span className={cn(
              "font-mono font-bold text-4xl tabular-nums mt-2",
              timeRemaining !== null && timeRemaining <= 10 ? "text-error" : "text-text-primary"
            )}>
              {timeRemaining !== null ? timeRemaining.toFixed(1) : timeLimitSeconds.toFixed(1)}s
            </span>
          )}

          {/* Ergebnis - gross */}
          {showResult && lastResult && (
            <span className={cn(
              "font-bold text-4xl tabular-nums mt-2",
              lastResult.distanceKm < 50 ? "text-success" :
              lastResult.distanceKm < 150 ? "text-accent" : "text-text-primary"
            )}>
              {lastResult.distanceKm.toFixed(1)} km
            </span>
          )}

          {/* Timeout */}
          {timeExpired && !showResult && (
            <span className="font-bold text-3xl text-error mt-2">{t("timeUp")}</span>
          )}

          {/* Button - feste Breite */}
          <div className="mt-4">
            {!showResult && !timeExpired && (
              <Button
                variant="primary"
                size="lg"
                onClick={handleGuess}
                disabled={!markerPosition}
                isLoading={submitting}
                className="w-80"
              >
                {submitting ? t("submitting") : (markerPosition ? t("submit") : t("placeMarker"))}
              </Button>
            )}

            {timeExpired && !showResult && (
              <Button variant="primary" size="lg" onClick={handleTimeoutSubmit} isLoading={submitting} className="w-80">
                {t("next")}
              </Button>
            )}

            {showResult && (
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  if (currentRoundIndex < releasedRounds.length - 1) {
                    handleNextRound();
                  } else if (allReleasedLocationsPlayed) {
                    setShowRoundSummary(true);
                  } else {
                    router.push(`/${locale}/groups/${groupId}`);
                  }
                }}
                className="w-80"
              >
                {currentRoundIndex < releasedRounds.length - 1
                  ? t("next")
                  : allReleasedLocationsPlayed
                  ? t("result")
                  : t("wait")}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Karte */}
      <div className="flex-1">
        <SwitzerlandMap
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
      </div>
    </div>
  );
}
