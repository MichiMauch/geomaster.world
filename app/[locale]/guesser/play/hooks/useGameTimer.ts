import { useState, useEffect, useCallback } from "react";
import { isPanoramaGameType } from "@/lib/game-types";
import { DEFAULT_TIME_LIMIT, PANORAMA_TIME_LIMIT } from "../constants";
import type { GameRound, Game, Guess } from "../types";

interface UseGameTimerProps {
  currentRound: GameRound | undefined;
  game: Game | null;
  userGuesses: Guess[];
  showResult: boolean;
  loading: boolean;
  onTimeout: () => void;
}

export function useGameTimer({
  currentRound,
  game,
  userGuesses,
  showResult,
  loading,
  onTimeout,
}: UseGameTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(DEFAULT_TIME_LIMIT);
  const [timerActive, setTimerActive] = useState(false);

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

  // Timer activation logic
   
  useEffect(() => {
    if (!showResult && !loading && currentRound && !userGuesses.some(g => g.gameRoundId === currentRound.id)) {
      setTimerActive(true);
      setTimeRemaining(getCurrentTimeLimit());
    } else {
      setTimerActive(false);
    }
  }, [currentRound?.id, showResult, loading, currentRound, userGuesses, getCurrentTimeLimit]);

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

  const stopTimer = useCallback(() => {
    setTimerActive(false);
  }, []);

  const resetTimer = useCallback((nextRound?: GameRound) => {
    const nextTimeLimit = nextRound?.timeLimitSeconds ??
      (isPanoramaGameType(nextRound?.gameType) ? PANORAMA_TIME_LIMIT : DEFAULT_TIME_LIMIT);
    setTimeRemaining(nextTimeLimit);
  }, []);

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
    getTimerColor,
  };
}
