"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { CountryMap, SummaryMap } from "@/components/Map";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { getEffectiveGameType } from "@/lib/game-types";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface GameRound {
  id: string;
  roundNumber: number;
  locationIndex: number;
  locationId: string;
  locationName: string;
  latitude: number;
  longitude: number;
  country: string;
  gameType?: string | null;
  timeLimitSeconds?: number | null;
}

interface Guess {
  gameRoundId: string;
  distanceKm: number;
  score: number;
  roundNumber: number;
  latitude?: number | null;
  longitude?: number | null;
}

interface Game {
  id: string;
  status: string;
  currentRound: number;
  country: string;
  gameType?: string | null;
  timeLimitSeconds?: number | null;
}

const FIXED_TIME_LIMIT = 30; // 30 seconds per location for ranked

export default function GuesserPlayPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);
  const router = useRouter();
  const routeParams = useParams();
  const locale = routeParams.locale as string;
  const { data: session } = useSession();
  const t = useTranslations("play");
  const tCommon = useTranslations("common");
  const tRanked = useTranslations("ranked");

  const [game, setGame] = useState<Game | null>(null);
  const [rounds, setRounds] = useState<GameRound[]>([]);
  const [userGuesses, setUserGuesses] = useState<Guess[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{
    distanceKm: number;
    score: number;
    targetLat: number;
    targetLng: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(FIXED_TIME_LIMIT);
  const [timerActive, setTimerActive] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);

  // Get or create guestId for non-logged-in users
  useEffect(() => {
    if (!session?.user?.id) {
      const stored = localStorage.getItem("guestId");
      if (stored) {
        setGuestId(stored);
      }
    }
  }, [session]);

  const fetchGameData = useCallback(async () => {
    try {
      const [gameRes, guessesRes] = await Promise.all([
        fetch(`/api/ranked/games/${gameId}?locale=${locale}`),
        fetch(`/api/guesses?gameId=${gameId}`),
      ]);

      if (gameRes.ok) {
        const gameData = await gameRes.json();
        setGame(gameData.game);
        setRounds(gameData.rounds);
      }

      if (guessesRes.ok) {
        const guessesData = await guessesRes.json();
        setUserGuesses(guessesData.guesses || []);
      }
    } catch (err) {
      console.error("Error fetching game:", err);
    } finally {
      setLoading(false);
    }
  }, [gameId, locale]);

  useEffect(() => {
    fetchGameData();
  }, [fetchGameData]);

  // Define currentRound before using it in useEffect dependencies
  const currentRound = rounds[currentRoundIndex];

  // Timer logic - starts automatically when round begins
  useEffect(() => {
    if (!showResult && !loading && currentRound && !userGuesses.some(g => g.gameRoundId === currentRound.id)) {
      setTimerActive(true);
      setTimeRemaining(FIXED_TIME_LIMIT);
    } else {
      setTimerActive(false);
    }
  }, [currentRoundIndex, showResult, loading, currentRound, userGuesses]);

  // Countdown timer
  useEffect(() => {
    if (!timerActive || showResult) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time's up! Auto-submit timeout
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, showResult]);
  const allRoundsPlayed = rounds.length > 0 && rounds.every((r) => userGuesses.some((g) => g.gameRoundId === r.id));
  const totalDistance = userGuesses.reduce((sum, g) => sum + g.distanceKm, 0);
  const totalScore = userGuesses.reduce((sum, g) => sum + g.score, 0);

  const handleTimeout = async () => {
    if (!currentRound || submitting) return;

    setTimerActive(false);
    setSubmitting(true);

    try {
      const response = await fetch("/api/guesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameRoundId: currentRound.id,
          timeout: true,
          timeSeconds: FIXED_TIME_LIMIT,
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
        setUserGuesses([
          ...userGuesses,
          {
            gameRoundId: currentRound.id,
            distanceKm: data.distanceKm,
            score: 0,
            roundNumber: currentRound.roundNumber,
            latitude: null,
            longitude: null,
          },
        ]);
        setShowResult(true);
      }
    } catch (err) {
      console.error("Error submitting timeout:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuess = async () => {
    if (!markerPosition || !currentRound || submitting) return;

    setTimerActive(false);
    setSubmitting(true);

    try {
      const timeUsed = FIXED_TIME_LIMIT - timeRemaining;
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

  const handleNextRound = () => {
    const nextRoundIndex = currentRoundIndex + 1;
    if (nextRoundIndex >= rounds.length) {
      // All rounds complete - complete the game and go to results
      handleCompleteGame();
      return;
    }
    setMarkerPosition(null);
    setShowResult(false);
    setLastResult(null);
    setCurrentRoundIndex(nextRoundIndex);
    setTimeRemaining(FIXED_TIME_LIMIT);
  };

  const handleCompleteGame = async () => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/ranked/games/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, guestId }),
      });

      if (response.ok) {
        // Redirect to results page
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

  // Determine button config
  const getButtonConfig = () => {
    if (showResult) {
      const isLastRound = currentRoundIndex >= rounds.length - 1;
      const resultVariant = lastResult && lastResult.distanceKm < 20 ? "success" : "primary";
      return {
        text: isLastRound ? tRanked("finishGame", { defaultValue: "Spiel beenden" }) : t("next"),
        variant: resultVariant as "success" | "primary",
        onClick: handleNextRound,
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

  const buttonConfig = getButtonConfig();

  // Timer color based on time remaining
  const getTimerColor = () => {
    if (timeRemaining > 10) return "text-primary";
    if (timeRemaining > 5) return "text-accent";
    return "text-error animate-pulse";
  };

  return (
    <div className="h-[calc(100dvh-52px)] max-w-[1440px] mx-auto relative">
      {/* Fullscreen Map */}
      <CountryMap
        gameType={currentRound?.gameType || (game ? getEffectiveGameType(game) : undefined)}
        country={currentRound?.country ?? game?.country ?? DEFAULT_COUNTRY}
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

      {/* Combined Badge - centered */}
      {currentRound && (
        <div className={cn(
          "absolute top-4 left-1/2 -translate-x-1/2 z-[500]",
          "bg-surface-1 rounded-lg",
          "flex items-center gap-3 px-4 py-2",
          "border-2 shadow-[0_4px_12px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.15)]",
          !showResult && timeRemaining > 10 && "border-primary",
          !showResult && timeRemaining <= 10 && timeRemaining > 5 && "border-accent",
          !showResult && timeRemaining <= 5 && "border-error",
          showResult && lastResult && lastResult.distanceKm < 20 && "border-success",
          showResult && lastResult && lastResult.distanceKm >= 20 && "border-surface-3"
        )}>
          {/* Location */}
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] text-text-muted uppercase tracking-widest">
              {t("whereIs")}
            </span>
            <span className="text-lg font-bold text-text-primary">
              {currentRound.locationName}
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-surface-3" />

          {/* Timer / Result */}
          <span className={cn(
            "font-mono font-bold text-lg tabular-nums min-w-[60px] text-center",
            showResult ? (
              lastResult && lastResult.distanceKm < 20 ? "text-success" :
              lastResult && lastResult.distanceKm >= 20 && lastResult.distanceKm < 100 ? "text-accent" :
              "text-text-primary"
            ) : getTimerColor()
          )}>
            {showResult && lastResult ? (
              <>{lastResult.distanceKm.toFixed(1)} km</>
            ) : (
              <>{timeRemaining}s</>
            )}
          </span>

          {/* Divider */}
          <div className="w-px h-6 bg-surface-3" />

          {/* Progress */}
          <span className="text-sm text-text-muted font-mono tabular-nums">
            {currentRoundIndex + 1}/5
          </span>

          {/* Divider */}
          <div className="w-px h-6 bg-surface-3" />

          {/* Action Button */}
          <Button
            variant={buttonConfig.variant}
            size="sm"
            onClick={buttonConfig.onClick}
            disabled={buttonConfig.disabled}
            isLoading={submitting}
            className="whitespace-nowrap"
          >
            {submitting ? "..." : buttonConfig.text}
          </Button>
        </div>
      )}

      {/* Back Link */}
      <Link
        href={`/${locale}/guesser`}
        className="absolute top-4 left-4 z-[500] bg-surface-1 rounded-lg px-3 py-2 flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors border border-surface-3 shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-sm">{tCommon("back")}</span>
      </Link>
    </div>
  );
}
