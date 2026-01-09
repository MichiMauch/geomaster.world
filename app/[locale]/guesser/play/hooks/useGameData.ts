import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import type { Game, GameRound, Guess, DynamicCountry, DynamicWorldQuiz } from "../types";

interface UseGameDataProps {
  gameId: string;
  locale: string;
}

export function useGameData({ gameId, locale }: UseGameDataProps) {
  const { data: session } = useSession();
  const [game, setGame] = useState<Game | null>(null);
  const [rounds, setRounds] = useState<GameRound[]>([]);
  const [userGuesses, setUserGuesses] = useState<Guess[]>([]);
  const [dynamicCountry, setDynamicCountry] = useState<DynamicCountry | null>(null);
  const [dynamicWorldQuiz, setDynamicWorldQuiz] = useState<DynamicWorldQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestId, setGuestId] = useState<string | null>(null);

  const isGuest = !session?.user?.id;

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
  };
}
