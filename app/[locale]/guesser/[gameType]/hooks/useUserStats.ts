"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface GameTypeStats {
  games: number;
  bestScore: number;
  totalScore: number;
}

interface UserStats {
  gameTypeBreakdown?: Record<string, GameTypeStats>;
}

export function useUserStats(gameType: string) {
  const { data: session, status } = useSession();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      const fetchUserStats = async () => {
        setLoading(true);
        try {
          const statsRes = await fetch("/api/ranked/stats");
          if (statsRes.ok) {
            const data = await statsRes.json();
            setUserStats(data.stats);
          }
        } catch (error) {
          console.error("Error fetching user stats:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchUserStats();
    } else {
      setLoading(false);
    }
  }, [status, session, gameType]);

  const gameTypeStats = userStats?.gameTypeBreakdown?.[gameType];

  return {
    userStats,
    gameTypeStats,
    loading,
    isAuthenticated: status === "authenticated",
  };
}
