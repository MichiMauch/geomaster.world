"use client";

import { useState, useEffect, useCallback } from "react";
import type { LeaderboardEntry, LeaderboardType } from "../types";

interface UseLeaderboardOptions {
  groupId: string;
  gameId?: string;
  blurred?: boolean;
}

export function useLeaderboard({ groupId, gameId, blurred = false }: UseLeaderboardOptions) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [type, setType] = useState<LeaderboardType>("weekly");
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [maxRoundNumber, setMaxRoundNumber] = useState(0);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [currentGameType, setCurrentGameType] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      let url = `/api/leaderboard?groupId=${groupId}&type=${type}`;
      if (gameId) {
        url += `&gameId=${gameId}`;
      }
      if (selectedRound !== null && type === "weekly") {
        url += `&roundNumber=${selectedRound}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard);
        if (data.revealed !== undefined) {
          setRevealed(data.revealed);
        }
        if (data.game?.maxRoundNumber !== undefined) {
          setMaxRoundNumber(data.game.maxRoundNumber);
        }
        if (data.game?.id) {
          setCurrentGameId(data.game.id);
        }
        if (data.game?.gameType) {
          setCurrentGameType(data.game.gameType);
        }
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    } finally {
      setLoading(false);
    }
  }, [groupId, gameId, type, selectedRound]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Poll for revealed state when blurred
  useEffect(() => {
    if (!blurred || revealed) return;

    const interval = setInterval(() => {
      fetchLeaderboard(false);
    }, 2000);

    return () => clearInterval(interval);
  }, [blurred, revealed, fetchLeaderboard]);

  const handleTypeChange = useCallback((newType: LeaderboardType) => {
    setType(newType);
    if (newType === "alltime") {
      setSelectedRound(null);
    }
  }, []);

  return {
    leaderboard,
    type,
    setType: handleTypeChange,
    loading,
    revealed,
    maxRoundNumber,
    selectedRound,
    setSelectedRound,
    currentGameId,
    currentGameType,
    showBlur: blurred && !revealed,
  };
}
