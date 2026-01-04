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
import {
  QuestionDisplay,
  isCountryQuizGameType,
  getCountryQuizCategory,
} from "@/components/country-quiz/QuestionDisplay";

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

interface DynamicCountry {
  id: string;
  centerLat: number;
  centerLng: number;
  boundsNorth: number | null;
  boundsSouth: number | null;
  boundsEast: number | null;
  boundsWest: number | null;
  defaultZoom: number;
  minZoom: number;
}

interface DynamicWorldQuiz {
  id: string;
  centerLat: number;
  centerLng: number;
  defaultZoom: number;
  minZoom: number;
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
  const [dynamicCountry, setDynamicCountry] = useState<DynamicCountry | null>(null);
  const [dynamicWorldQuiz, setDynamicWorldQuiz] = useState<DynamicWorldQuiz | null>(null);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{
    distanceKm: number;
    score: number;
    targetLat: number;
    targetLng: number;
    insideCountry?: boolean;
    targetCountryCode?: string;
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
        if (gameData.dynamicCountry) {
          setDynamicCountry(gameData.dynamicCountry);
        }
        if (gameData.dynamicWorldQuiz) {
          setDynamicWorldQuiz(gameData.dynamicWorldQuiz);
        }
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

  // Countdown timer with centiseconds (updates every 10ms)
  useEffect(() => {
    if (!timerActive || showResult) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0.01) {
          // Time's up! Auto-submit timeout
          handleTimeout();
          return 0;
        }
        return prev - 0.01;
      });
    }, 10);

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
          insideCountry: data.insideCountry,
          targetCountryCode: data.targetCountryCode,
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
      // For country quizzes, success is based on insideCountry
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

  const buttonConfig = getButtonConfig();

  // Timer color based on time remaining
  const getTimerColor = () => {
    if (timeRemaining > 10) return "text-text-primary";
    if (timeRemaining > 5) return "text-accent";
    return "text-error animate-pulse";
  };

  return (
    <div className="h-dvh max-w-[1440px] mx-auto relative">
      {/* Fullscreen Map */}
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

      {/* Badge Bar - simplified: Location | Timer | Button */}
      {currentRound && (() => {
        const countryQuizCategory = getCountryQuizCategory(currentRound.gameType);
        const isCountryQuiz = !!countryQuizCategory;

        // For country quizzes, success is based on insideCountry, not distance
        const isSuccess = isCountryQuiz
          ? lastResult?.insideCountry === true
          : lastResult && lastResult.distanceKm < 20;

        // Get result text for country quizzes
        const getCountryQuizResultText = () => {
          if (!lastResult) return "";
          if (lastResult.insideCountry) {
            switch (locale) {
              case "de":
                return "Richtig!";
              case "sl":
                return "Pravilno!";
              default:
                return "Correct!";
            }
          } else {
            return `${lastResult.distanceKm.toFixed(0)} km`;
          }
        };

        return (
          <div className={cn(
            "absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 z-[500]",
            "bg-surface-1 rounded-lg",
            "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2",
            "border-2 shadow-[0_4px_12px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.15)]",
            !showResult && timeRemaining > 10 && "border-primary",
            !showResult && timeRemaining <= 10 && timeRemaining > 5 && "border-accent",
            !showResult && timeRemaining <= 5 && "border-error",
            showResult && isSuccess && "border-success",
            showResult && !isSuccess && "border-surface-3"
          )}>
            {/* Question/Location Display */}
            {isCountryQuiz && countryQuizCategory ? (
              <QuestionDisplay
                question={currentRound.locationName}
                category={countryQuizCategory}
                locale={locale}
              />
            ) : (
              <span className="text-sm sm:text-base font-bold text-text-primary">
                {currentRound.locationName}
              </span>
            )}

            {/* Divider */}
            <div className="w-px h-5 bg-surface-3" />

            {/* Timer / Result */}
            <span className={cn(
              "font-mono font-bold text-sm sm:text-base tabular-nums min-w-[55px] text-center",
              showResult ? (
                isSuccess ? "text-success" :
                lastResult && lastResult.distanceKm < 100 ? "text-accent" :
                "text-text-primary"
              ) : getTimerColor()
            )}>
              {showResult && lastResult ? (
                isCountryQuiz ? getCountryQuizResultText() : <>{lastResult.distanceKm.toFixed(1)} km</>
              ) : (
                <>{timeRemaining.toFixed(2)}</>
              )}
            </span>

            {/* Divider */}
            <div className="w-px h-5 bg-surface-3" />

            {/* Action Button */}
            <Button
              variant={buttonConfig.variant}
              size="sm"
              onClick={buttonConfig.onClick}
              disabled={buttonConfig.disabled}
              isLoading={submitting}
              className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3"
            >
              {submitting ? "..." : buttonConfig.text}
            </Button>
          </div>
        );
      })()}

      {/* Progress indicator - bottom center */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500]">
        <div className="bg-surface-1/90 backdrop-blur-sm rounded-full px-4 py-1.5 border border-surface-3 shadow-lg">
          <span className="text-sm text-text-muted font-mono tabular-nums">
            {currentRoundIndex + 1} / 5
          </span>
        </div>
      </div>
    </div>
  );
}
