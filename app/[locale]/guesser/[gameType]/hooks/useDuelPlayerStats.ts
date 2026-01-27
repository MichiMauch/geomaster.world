import { useState, useCallback, useEffect } from "react";

export interface DuelPlayerStats {
  wins: number;
  losses: number;
  totalDuels: number;
  winRate: number;
  rank: number | null;
  duelPoints: number;
}

interface UseDuelPlayerStatsReturn {
  duelStats: DuelPlayerStats | null;
  loading: boolean;
  fetchDuelStats: () => Promise<void>;
}

export function useDuelPlayerStats(gameType: string, enabled: boolean = true): UseDuelPlayerStatsReturn {
  const [duelStats, setDuelStats] = useState<DuelPlayerStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDuelStats = useCallback(async () => {
    if (!gameType) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/ranked/leaderboard/duel/me?gameType=${encodeURIComponent(gameType)}`);
      if (res.ok) {
        const data = await res.json();
        setDuelStats(data);
      } else if (res.status === 401) {
        // Not logged in - no stats
        setDuelStats(null);
      }
    } catch (error) {
      console.error("Error fetching duel player stats:", error);
    } finally {
      setLoading(false);
    }
  }, [gameType]);

  useEffect(() => {
    if (enabled) {
      fetchDuelStats();
    }
  }, [enabled, fetchDuelStats]);

  return {
    duelStats,
    loading,
    fetchDuelStats,
  };
}
