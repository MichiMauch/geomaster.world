import { useState, useCallback, useEffect } from "react";

export interface DuelRankingEntry {
  rank: number;
  userId: string;
  userName: string | null;
  userImage: string | null;
  wins: number;
  losses: number;
  totalDuels: number;
  winRate: number;
}

interface UseDuelRankingsReturn {
  rankings: DuelRankingEntry[];
  loading: boolean;
  fetchDuelRankings: () => Promise<void>;
}

export function useDuelRankings(gameType: string, enabled: boolean = true): UseDuelRankingsReturn {
  const [rankings, setRankings] = useState<DuelRankingEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDuelRankings = useCallback(async () => {
    if (!gameType) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/ranked/leaderboard/duel?gameType=${encodeURIComponent(gameType)}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setRankings(data.leaderboard || []);
      }
    } catch (error) {
      console.error("Error fetching duel rankings:", error);
    } finally {
      setLoading(false);
    }
  }, [gameType]);

  useEffect(() => {
    if (enabled) {
      fetchDuelRankings();
    }
  }, [enabled, fetchDuelRankings]);

  return {
    rankings,
    loading,
    fetchDuelRankings,
  };
}
