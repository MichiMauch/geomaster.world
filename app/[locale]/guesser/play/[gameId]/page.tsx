"use client";

import { useState, useEffect, use, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { CountryMap, PanoramaMap } from "@/components/Map";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { getEffectiveGameType, getGameTypeConfig, isPanoramaGameType } from "@/lib/game-types";
import { calculateDistance, calculatePixelDistance } from "@/lib/distance";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { isCountryQuizGameType } from "@/components/country-quiz/QuestionDisplay";
import { LevelUpCelebration } from "@/components/LevelUpCelebration";
import { cn } from "@/lib/utils";
import { useGameData } from "../hooks/useGameData";
import { useGameTimer } from "../hooks/useGameTimer";
import { GameBadgeBar } from "../components/GameBadgeBar";
import { EmojiQuestionOverlay } from "../components/EmojiQuestionOverlay";
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
  const searchParams = useSearchParams();
  const locale = routeParams.locale as string;
  const t = useTranslations("play");

  // Test mode: simulate level up with ?testLevelUp=true
  const testLevelUp = searchParams.get("testLevelUp") === "true";
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
    // Anti-cheat: active round management
    activeRound,
    serverTimeRemaining,
    locationStartedAt,
    startLocation,
    getActiveLocation,
    clearActiveRound,
    resetTimerState,
    notifyMapReady,
  } = useGameData({ gameId, locale });

  // Local state
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<GuessResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [levelUpData, setLevelUpData] = useState<LevelUpInfo | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Ref-based guard for handleMapReady to avoid stale closure issues
  const mapReadyCalledRef = useRef(false);
  const prevRoundIndexRef = useRef(currentRoundIndex);

  // Synchronously reset the ref when round changes (during render, not in effect!)
  // This ensures the ref is reset BEFORE CountryMap's effects run
  if (prevRoundIndexRef.current !== currentRoundIndex) {
    prevRoundIndexRef.current = currentRoundIndex;
    mapReadyCalledRef.current = false;
  }

  // Handle map ready callback - starts the timer
  const handleMapReady = useCallback(async () => {
    // Ref-based guard - no stale closure issues!
    if (mapReadyCalledRef.current) return;
    mapReadyCalledRef.current = true;
    setMapReady(true);

    // For logged-in users: notify server to start the timer
    // Only call if game is already initialized (otherwise the effect below handles it)
    if (!isGuest && initialized && currentRoundIndex !== null) {
      const locationIndex = rounds[currentRoundIndex]?.locationIndex ?? currentRoundIndex + 1;
      await notifyMapReady(locationIndex);
    }
  }, [isGuest, initialized, currentRoundIndex, rounds, notifyMapReady]);


  // Call notifyMapReady when initialization completes and map is already ready
  // This handles the case where the map loads faster than game initialization
  useEffect(() => {
    if (initialized && mapReady && !isGuest && !locationStartedAt) {
      const locationIndex = rounds[currentRoundIndex]?.locationIndex ?? currentRoundIndex + 1;
      notifyMapReady(locationIndex);
    }
  }, [initialized, mapReady, isGuest, locationStartedAt, currentRoundIndex, rounds, notifyMapReady]);

  // DISPLAY-ROUND: Immer aus rounds[] - sofort verfügbar für UI (Ortsname, etc.)
  // Reagiert SOFORT auf currentRoundIndex Änderung
  const displayRound = rounds[currentRoundIndex];

  // PLAYABLE-ROUND: Für Koordinaten - bei logged-in Users aus activeRound (Anti-Cheat)
  // Bei Guests direkt aus rounds[] (sie haben alle Koordinaten)
  const playableRound = isGuest ? rounds[currentRoundIndex] : activeRound;

  // currentRound für Kompatibilität: Kombiniert Display-Info mit Koordinaten
  // Zeigt SOFORT neuen Ortsnamen, Koordinaten kommen nach wenn API fertig
  const currentRound = displayRound ? {
    ...displayRound,
    // Koordinaten aus playableRound übernehmen (falls verfügbar)
    latitude: playableRound?.latitude ?? null,
    longitude: playableRound?.longitude ?? null,
    // Panorama-Felder aus playableRound
    mapillaryImageKey: playableRound?.mapillaryImageKey ?? null,
    heading: playableRound?.heading ?? null,
    pitch: playableRound?.pitch ?? null,
  } : null;

  // Timer hook
  const handleTimeout = useCallback(async () => {
    if (!currentRound || submitting) return;

    setSubmitting(true);

    // For guests: handle timeout client-side
    if (isGuest && currentRound.latitude !== null && currentRound.longitude !== null) {
      const gameType = currentRound.gameType || (game ? getEffectiveGameType(game) : "country:switzerland");
      const config = getGameTypeConfig(gameType);
      // Fallback for dynamic game types (country/world/panorama from DB)
      const timeoutDistance = config?.timeoutPenalty ?? 5000;

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
    initFromServer,
    getTimerColor,
  } = useGameTimer({
    currentRound,
    game,
    userGuesses,
    showResult,
    loading: loading || locationLoading,
    onTimeout: handleTimeout,
    // Anti-cheat: Server-side time tracking
    serverTimeRemaining,
    locationStartedAt,
    isGuest,
    // Timer only starts when map is visible
    mapReady,
  });

  const totalScore = userGuesses.reduce((sum, g) => sum + g.score, 0);

  // Anti-cheat: Initialize game state on first load
  useEffect(() => {
    if (loading || initialized || !game || rounds.length === 0) return;

    const initializeGame = async () => {
      // For guests, just set initialized (they get all coordinates)
      if (isGuest) {
        // Find first unguessed round
        const completedRoundIds = new Set(userGuesses.map(g => g.gameRoundId));
        const firstUnguessed = rounds.findIndex(r => !completedRoundIds.has(r.id));

        if (firstUnguessed === -1) {
          // All rounds completed - redirect to results
          router.push(`/${locale}/guesser/results/${gameId}`);
          return;
        }

        setCurrentRoundIndex(firstUnguessed);
        setInitialized(true);
        return;
      }

      // For logged-in users: check server state
      setLocationLoading(true);
      try {
        const status = await getActiveLocation();

        if (status.gameComplete) {
          // All rounds completed - redirect to results
          router.push(`/${locale}/guesser/results/${gameId}`);
          return;
        }

        if (status.activeRound) {
          // There's an active round - check if time expired
          const roundIndex = rounds.findIndex(r => r.id === status.activeRound!.id);
          if (roundIndex !== -1) {
            setCurrentRoundIndex(roundIndex);
          }

          if (status.timeExpired) {
            // Time already expired - trigger timeout
            handleTimeout();
          }
        } else if (status.needsStart && status.nextLocationIndex) {
          // Need to start the next location
          const result = await startLocation(status.nextLocationIndex);

          if (result.success && result.round) {
            const roundIndex = rounds.findIndex(r => r.locationIndex === status.nextLocationIndex);
            if (roundIndex !== -1) {
              setCurrentRoundIndex(roundIndex);
            }
          }
        }
      } finally {
        setLocationLoading(false);
        setInitialized(true);
      }
    };

    initializeGame();
  }, [loading, initialized, game, rounds, isGuest, userGuesses, router, locale, gameId, getActiveLocation, startLocation, handleTimeout]);

  const handleGuess = async () => {
    if (!markerPosition || !currentRound || submitting) return;

    stopTimer();
    setSubmitting(true);

    const timeUsed = getCurrentTimeLimit() - timeRemaining;
    const gameType = currentRound.gameType || (game ? getEffectiveGameType(game) : "country:switzerland");
    const isImageGame = gameType.startsWith("image:");

    // For guests: handle guess client-side
    if (isGuest && currentRound.latitude !== null && currentRound.longitude !== null) {
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

  const handleNextRound = async () => {
    const nextRoundIndex = currentRoundIndex + 1;
    if (nextRoundIndex >= rounds.length) {
      handleCompleteGame();
      return;
    }

    // Reset timer state FIRST - so timer waits for new locationStartedAt
    // (otherwise timer calculates with OLD locationStartedAt = wrong time!)
    resetTimerState();

    // Also reset the displayed time to 30 immediately (don't show old value)
    resetTimer(rounds[nextRoundIndex]);

    // Reset mapReady - must happen before currentRoundIndex changes
    // (useEffect would run AFTER CountryMap's onReady, causing race condition)
    setMapReady(false);

    // SOFORT neuen Index setzen - zeigt sofort neuen Ortsnamen
    setCurrentRoundIndex(nextRoundIndex);

    // Clear state for next round
    // WICHTIG: clearActiveRound() NICHT aufrufen - startLocation() überschreibt activeRound direkt
    // Sonst flackert die UI weil currentRound kurzzeitig null ist
    setMarkerPosition(null);
    setShowResult(false);
    setLastResult(null);

    // For logged-in users: start the next location via API
    if (!isGuest) {
      setLocationLoading(true);
      try {
        const nextLocationIndex = rounds[nextRoundIndex]?.locationIndex ?? nextRoundIndex + 1;
        const result = await startLocation(nextLocationIndex);

        if (!result.success && !result.alreadyGuessed) {
          console.error("Failed to start next location:", result.error);
          resetTimer(rounds[nextRoundIndex]);
        }
      } finally {
        setLocationLoading(false);
      }
    } else {
      // Guest mode: simple client-side transition
      resetTimer(rounds[nextRoundIndex]);
    }
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
      // Check if this is a duel game with challenge data (accepter flow)
      let challengeData = null;
      const storedChallenge = sessionStorage.getItem("duelChallenge");
      if (storedChallenge && game?.mode === "duel") {
        try {
          challengeData = JSON.parse(storedChallenge);
          sessionStorage.removeItem("duelChallenge"); // Clear after use
        } catch {
          // Ignore parse errors
        }
      }

      const response = await fetch("/api/ranked/games/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
        },
        body: JSON.stringify({ gameId, guestId, challengeData }),
      });

      if (response.ok) {
        const data = await response.json();

        // Test mode or real level up: show celebration
        if (data.levelUp?.leveledUp || testLevelUp) {
          setLevelUpData({
            newLevel: data.levelUp?.newLevel ?? 5,
            newLevelName: data.levelUp?.newLevelName ?? "Entdecker",
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
    // Navigate to results page with fade-in flag
    router.push(`/${locale}/guesser/results/${gameId}?fromLevelUp=true`);
  };

  // Loading state (initial load or waiting for initialization)
  // Beim Rundenwechsel ist initialized=true, daher kein Spinner
  if (loading || (!initialized && !isGuest)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-secondary">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  // No game or no display round = show error
  // displayRound ist IMMER verfügbar wenn rounds geladen sind (reagiert sofort auf currentRoundIndex)
  // Die Koordinaten-Verfügbarkeit wird separat in der Karten-Komponente gehandhabt
  const hasValidRound = game && displayRound;

  if (!hasValidRound) {
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
      {/* Background - same as Results page for smooth transition */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: 'url("/images/hero-map-bg.jpg")',
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
      </div>

      {/* Subtle corner glows */}
      <div className="pointer-events-none absolute inset-0 z-[1]">
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent/5 blur-3xl rounded-full translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Fullscreen Map - fades out when LevelUp is shown */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-300",
          levelUpData ? "opacity-0" : "opacity-100"
        )}
      >
        {isPanorama && currentRound?.mapillaryImageKey ? (
          <PanoramaMap
            roundId={currentRound?.id}
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
            onReady={handleMapReady}
          />
        ) : (
          <CountryMap
            roundId={currentRound?.id}
            gameType={game ? getEffectiveGameType(game) : undefined}
            country={game?.country ?? DEFAULT_COUNTRY}
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
            onReady={handleMapReady}
          />
        )}
      </div>

      {/* Badge Bar - hidden when LevelUp is shown */}
      {currentRound && !levelUpData && (
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

      {/* Emoji Question Overlay - only for emoji-countries quiz */}
      {currentRound?.gameType === "world:emoji-countries" && !levelUpData && (
        <EmojiQuestionOverlay
          question={currentRound.locationName}
          locale={locale}
          hidden={showResult}
        />
      )}

      {/* Progress indicator - hidden when LevelUp is shown */}
      {!levelUpData && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500]">
          <div className="bg-surface-1/90 backdrop-blur-sm rounded-full px-4 py-1.5 border border-surface-3 shadow-lg">
            <span className="text-sm text-text-muted font-mono tabular-nums">
              {currentRoundIndex + 1} / 5
            </span>
          </div>
        </div>
      )}

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
