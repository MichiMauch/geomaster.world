import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import type { Game, GameRound, ActiveRound, Guess, DynamicCountry, DynamicWorldQuiz } from "../types";

interface UseGameDataProps {
  gameId: string;
  locale: string;
}

interface ActiveLocationResponse {
  round?: ActiveRound;
  activeRound?: ActiveRound;
  timeRemaining?: number;
  timeLimit?: number;
  startedAt?: number;
  timeExpired?: boolean;
  needsStart?: boolean;
  nextLocationIndex?: number;
  alreadyGuessed?: boolean;
  gameComplete?: boolean;
  refreshPenalty?: boolean; // True if user refreshed during active round (auto-timeout applied)
  waitingForMapReady?: boolean; // True if timer hasn't started yet (waiting for map to load)
  needsMapReady?: boolean; // True if client should call /map-ready
}

interface MapReadyResponse {
  success: boolean;
  locationStartedAt: number;
  serverTimeRemaining: number;
  alreadyStarted?: boolean;
}

export function useGameData({ gameId, locale }: UseGameDataProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [game, setGame] = useState<Game | null>(null);
  const [rounds, setRounds] = useState<GameRound[]>([]);
  const [userGuesses, setUserGuesses] = useState<Guess[]>([]);
  const [dynamicCountry, setDynamicCountry] = useState<DynamicCountry | null>(null);
  const [dynamicWorldQuiz, setDynamicWorldQuiz] = useState<DynamicWorldQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestId, setGuestId] = useState<string | null>(null);

  // Active round state (for anti-cheat)
  const [activeRound, setActiveRound] = useState<ActiveRound | null>(null);
  const [serverTimeRemaining, setServerTimeRemaining] = useState<number | null>(null);
  const [locationStartedAt, setLocationStartedAt] = useState<number | null>(null);
  const startLocationCalledRef = useRef<number | null>(null);

  const isGuest = !session?.user?.id && sessionStatus !== "loading";

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
      const gameRes = await fetch(`/api/ranked/games/${gameId}?locale=${locale}`);

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

      // Only fetch guesses for logged-in users
      if (!isGuest) {
        const guessesRes = await fetch(`/api/guesses?gameId=${gameId}`);
        if (guessesRes.ok) {
          const guessesData = await guessesRes.json();
          setUserGuesses(guessesData.guesses || []);
        }
      }
    } catch (err) {
      console.error("Error fetching game:", err);
    } finally {
      setLoading(false);
    }
  }, [gameId, locale, isGuest]);

  useEffect(() => {
    fetchGameData();
  }, [fetchGameData]);

  const addGuess = useCallback((guess: Guess) => {
    setUserGuesses((prev) => [...prev, guess]);
  }, []);

  // Start a new location (anti-cheat: only way to get coordinates for logged-in users)
  const startLocation = useCallback(async (locationIndex: number): Promise<{
    success: boolean;
    round?: ActiveRound;
    timeRemaining?: number;
    error?: string;
    alreadyGuessed?: boolean;
    waitingForMapReady?: boolean;
  }> => {
    // For guests, just use the pre-loaded round data
    if (isGuest) {
      const round = rounds.find(r => r.locationIndex === locationIndex);
      if (round && round.latitude !== null && round.longitude !== null) {
        const activeRoundData = round as ActiveRound;
        setActiveRound(activeRoundData);
        setServerTimeRemaining(round.timeLimitSeconds ?? 30);
        setLocationStartedAt(Date.now());
        return { success: true, round: activeRoundData, timeRemaining: round.timeLimitSeconds ?? 30 };
      }
      return { success: false, error: "Round not found" };
    }

    // Prevent duplicate calls for the same location
    if (startLocationCalledRef.current === locationIndex) {
      return { success: false, error: "Already starting this location" };
    }
    startLocationCalledRef.current = locationIndex;

    try {
      const res = await fetch(`/api/ranked/games/${gameId}/start-location?locale=${locale}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationIndex }),
      });

      if (res.ok) {
        const data: ActiveLocationResponse = await res.json();
        const roundData = data.round || data.activeRound;

        if (roundData) {
          setActiveRound(roundData);
          // Timer not started yet - will be set by notifyMapReady
          // For now, just store the time limit
          setServerTimeRemaining(data.timeLimit ?? data.timeRemaining ?? 30);
          // Don't set locationStartedAt here - wait for map to be ready

          // Update the round in the rounds array with coordinates
          setRounds(prev => prev.map(r =>
            r.locationIndex === locationIndex
              ? { ...r, ...roundData, status: "pending" as const }
              : r
          ));

          return {
            success: true,
            round: roundData,
            timeRemaining: data.timeLimit ?? data.timeRemaining ?? 30,
            waitingForMapReady: data.waitingForMapReady,
          };
        }
      } else {
        const errorData = await res.json();
        startLocationCalledRef.current = null; // Allow retry on error

        if (errorData.alreadyGuessed) {
          return { success: false, alreadyGuessed: true, error: "Already guessed" };
        }
        return { success: false, error: errorData.error || "Failed to start location" };
      }
    } catch (err) {
      console.error("Error starting location:", err);
      startLocationCalledRef.current = null; // Allow retry on error
      return { success: false, error: "Network error" };
    }

    return { success: false, error: "Unknown error" };
  }, [gameId, locale, isGuest, rounds]);

  // Get current active location status (for recovery after refresh)
  const getActiveLocation = useCallback(async (): Promise<{
    activeRound: ActiveRound | null;
    timeRemaining: number;
    timeExpired: boolean;
    needsStart: boolean;
    nextLocationIndex: number | null;
    gameComplete: boolean;
    refreshPenalty: boolean;
  }> => {
    // For guests, determine state from local data
    if (isGuest) {
      const completedCount = userGuesses.length;
      const nextIndex = completedCount + 1;
      return {
        activeRound: null,
        timeRemaining: 0,
        timeExpired: false,
        needsStart: nextIndex <= 5,
        nextLocationIndex: nextIndex <= 5 ? nextIndex : null,
        gameComplete: completedCount >= 5,
        refreshPenalty: false,
      };
    }

    try {
      const res = await fetch(`/api/ranked/games/${gameId}/start-location?locale=${locale}`);

      if (res.ok) {
        const data: ActiveLocationResponse = await res.json();

        if (data.activeRound) {
          setActiveRound(data.activeRound);
          setServerTimeRemaining(data.timeRemaining ?? null);
          setLocationStartedAt(data.startedAt ?? null);
        }

        return {
          activeRound: data.activeRound || null,
          timeRemaining: data.timeRemaining || 0,
          timeExpired: data.timeExpired || false,
          needsStart: data.needsStart || false,
          nextLocationIndex: data.nextLocationIndex || null,
          gameComplete: data.gameComplete || false,
          refreshPenalty: data.refreshPenalty || false,
        };
      }
    } catch (err) {
      console.error("Error getting active location:", err);
    }

    return {
      activeRound: null,
      timeRemaining: 0,
      timeExpired: false,
      needsStart: true,
      nextLocationIndex: 1,
      gameComplete: false,
      refreshPenalty: false,
    };
  }, [gameId, locale, isGuest, userGuesses.length]);

  // Clear active round (after guess is submitted)
  const clearActiveRound = useCallback(() => {
    setActiveRound(null);
    setServerTimeRemaining(null);
    setLocationStartedAt(null);
    startLocationCalledRef.current = null;
  }, []);

  // Notify server that map is ready (starts the timer)
  const notifyMapReady = useCallback(async (locationIndex: number): Promise<{
    success: boolean;
    serverTimeRemaining?: number;
  }> => {
    // For guests, just set the start time locally
    if (isGuest) {
      setLocationStartedAt(Date.now());
      return { success: true, serverTimeRemaining: serverTimeRemaining ?? 30 };
    }

    try {
      const res = await fetch(`/api/ranked/games/${gameId}/map-ready`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationIndex }),
      });

      if (res.ok) {
        const data: MapReadyResponse = await res.json();
        setLocationStartedAt(data.locationStartedAt);
        setServerTimeRemaining(data.serverTimeRemaining);
        return { success: true, serverTimeRemaining: data.serverTimeRemaining };
      } else {
        console.error("Failed to notify map ready");
        return { success: false };
      }
    } catch (err) {
      console.error("Error notifying map ready:", err);
      return { success: false };
    }
  }, [gameId, isGuest, serverTimeRemaining]);

  return {
    game,
    rounds,
    userGuesses,
    dynamicCountry,
    dynamicWorldQuiz,
    loading,
    isGuest,
    guestId,
    addGuess,
    refetch: fetchGameData,
    // Anti-cheat: active round management
    activeRound,
    serverTimeRemaining,
    locationStartedAt,
    startLocation,
    getActiveLocation,
    clearActiveRound,
    notifyMapReady,
  };
}
