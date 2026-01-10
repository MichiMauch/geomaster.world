import { useState, useEffect, useCallback, useRef } from "react";
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
}: UseGameTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(DEFAULT_TIME_LIMIT);
  const [timerActive, setTimerActive] = useState(false);
  const lastServerSyncRef = useRef<number | null>(null);

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

  // Timer activation logic - now syncs with server time for logged-in users
  useEffect(() => {
    if (!showResult && !loading && currentRound && !userGuesses.some(g => g.gameRoundId === currentRound.id)) {
      setTimerActive(true);

      // For logged-in users: use server time if available
      if (!isGuest && serverTimeRemaining !== null && serverTimeRemaining !== undefined && locationStartedAt) {
        // Calculate actual remaining time based on when location started
        const elapsedMs = Date.now() - locationStartedAt;
        const elapsedSeconds = elapsedMs / 1000;
        const timeLimit = getCurrentTimeLimit();
        const actualRemaining = Math.max(0, timeLimit - elapsedSeconds);

        setTimeRemaining(actualRemaining);
        lastServerSyncRef.current = Date.now();
      } else {
        // Guest mode or no server data: use client-side timer
        setTimeRemaining(getCurrentTimeLimit());
      }
    } else {
      setTimerActive(false);
    }
  }, [currentRound?.id, showResult, loading, currentRound, userGuesses, getCurrentTimeLimit, serverTimeRemaining, locationStartedAt, isGuest]);

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
