import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { isPanoramaGameType } from "@/lib/game-types";
import { DEFAULT_TIME_LIMIT, PANORAMA_TIME_LIMIT } from "../constants";
import type { GameRound, Game, Guess } from "../types";

interface UseGameTimerProps {
  currentRound: GameRound | null | undefined;
  game: Game | null;
  userGuesses: Guess[];
  showResult: boolean;
  loading: boolean;
  onTimeout: () => void;
  // Anti-cheat: Server-side time tracking
  serverTimeRemaining?: number | null;
  locationStartedAt?: number | null;
  isGuest?: boolean;
  // Map ready state - timer only starts when map is visible
  mapReady?: boolean;
}

export function useGameTimer({
  currentRound,
  game,
  userGuesses,
  showResult,
  loading,
  onTimeout,
  serverTimeRemaining,
  locationStartedAt,
  isGuest = false,
  mapReady = false,
}: UseGameTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(DEFAULT_TIME_LIMIT);
  const [timerActive, setTimerActive] = useState(false);
  const lastServerSyncRef = useRef<number | null>(null);
  const initializedRoundRef = useRef<string | null>(null);

  // Helper to get time limit for current round
  const getCurrentTimeLimit = useCallback(() => {
    if (currentRound?.timeLimitSeconds) {
      return currentRound.timeLimitSeconds;
    }
    const gameType = currentRound?.gameType || game?.gameType;
    if (isPanoramaGameType(gameType)) {
      return PANORAMA_TIME_LIMIT;
    }
    return DEFAULT_TIME_LIMIT;
  }, [currentRound, game]);

  // Check if current round has been guessed (memoized to prevent re-renders)
  const currentRoundGuessed = useMemo(() => {
    if (!currentRound) return false;
    return userGuesses.some(g => g.gameRoundId === currentRound.id);
  }, [currentRound, userGuesses]);

  // Timer activation logic - now syncs with server time for logged-in users
  // IMPORTANT: Timer only starts when mapReady is true (map is visible to player)
  useEffect(() => {
    const roundId = currentRound?.id;

    // Deactivate timer conditions
    // Key change: also require mapReady to be true before starting timer
    if (showResult || loading || !currentRound || currentRoundGuessed || !mapReady) {
      setTimerActive(false);
      return;
    }

    // For logged-in users: also require locationStartedAt to be set (from map-ready API)
    if (!isGuest && !locationStartedAt) {
      setTimerActive(false);
      return;
    }

    // Activate timer when all conditions are met
    setTimerActive(true);

    // Prevent re-initialization of time for the same round (but timer is already active above)
    if (initializedRoundRef.current === roundId) {
      return;
    }

    // Mark this round as initialized
    initializedRoundRef.current = roundId ?? null;

    // For logged-in users: use server time if available
    if (!isGuest && serverTimeRemaining !== null && serverTimeRemaining !== undefined && locationStartedAt) {
      // Calculate actual remaining time based on when location started
      const elapsedMs = Date.now() - locationStartedAt;
      const elapsedSeconds = elapsedMs / 1000;
      const timeLimit = getCurrentTimeLimit();

      // If timer just started (< 1 second elapsed), show full time to avoid jumpy display
      // This happens during normal round transitions. For page refreshes mid-round,
      // elapsed time will be > 1 second and we show the actual remaining time.
      if (elapsedSeconds < 1) {
        setTimeRemaining(timeLimit);
      } else {
        const actualRemaining = Math.max(0, timeLimit - elapsedSeconds);
        setTimeRemaining(actualRemaining);
      }

      lastServerSyncRef.current = Date.now();
    } else {
      // Guest mode or no server data: use client-side timer
      setTimeRemaining(getCurrentTimeLimit());
    }
  }, [currentRound?.id, showResult, loading, currentRoundGuessed, getCurrentTimeLimit, serverTimeRemaining, locationStartedAt, isGuest, mapReady]);

  // Countdown timer with centiseconds
  useEffect(() => {
    if (!timerActive || showResult) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0.01) {
          onTimeout();
          return 0;
        }
        return prev - 0.01;
      });
    }, 10);

    return () => clearInterval(interval);
  }, [timerActive, showResult, onTimeout]);

  // Sync timer when tab becomes visible again (anti-cheat for tab switching)
  useEffect(() => {
    if (isGuest || !locationStartedAt || !timerActive) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Tab is visible again - recalculate time from server timestamp
        const timeLimit = getCurrentTimeLimit();
        const elapsedMs = Date.now() - locationStartedAt;
        const elapsedSeconds = elapsedMs / 1000;
        const actualRemaining = Math.max(0, timeLimit - elapsedSeconds);

        setTimeRemaining(actualRemaining);

        if (actualRemaining <= 0) {
          // Time expired while away - trigger timeout
          onTimeout();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isGuest, locationStartedAt, timerActive, getCurrentTimeLimit, onTimeout]);

  const stopTimer = useCallback(() => {
    setTimerActive(false);
  }, []);

  const resetTimer = useCallback((nextRound?: GameRound) => {
    const nextTimeLimit = nextRound?.timeLimitSeconds ??
      (isPanoramaGameType(nextRound?.gameType) ? PANORAMA_TIME_LIMIT : DEFAULT_TIME_LIMIT);
    setTimeRemaining(nextTimeLimit);
    // Clear the initialized round ref to allow re-initialization
    initializedRoundRef.current = null;
  }, []);

  // Initialize timer from server time (for recovery after refresh)
  const initFromServer = useCallback((serverTime: number, startedAt: number) => {
    const elapsedMs = Date.now() - startedAt;
    const elapsedSeconds = elapsedMs / 1000;
    const actualRemaining = Math.max(0, serverTime - elapsedSeconds);

    setTimeRemaining(actualRemaining);
    lastServerSyncRef.current = Date.now();

    if (actualRemaining <= 0) {
      // Time already expired - trigger timeout
      onTimeout();
    }
  }, [onTimeout]);

  const getTimerColor = useCallback(() => {
    if (timeRemaining > 10) return "text-text-primary";
    if (timeRemaining > 5) return "text-accent";
    return "text-error animate-pulse";
  }, [timeRemaining]);

  return {
    timeRemaining,
    timerActive,
    getCurrentTimeLimit,
    stopTimer,
    resetTimer,
    initFromServer,
    getTimerColor,
  };
}
