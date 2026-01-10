"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface PlayerRankData {
  rank: number | null;
  totalPlayers: number;
  topPercentage: number | null;
  bestScore: number;
  totalScore: number; // Total score for this game type
}

export function usePlayerRank(gameType: string) {
  const { data: session, status } = useSession();
  const [rankData, setRankData] = useState<PlayerRankData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      const fetchPlayerRank = async () => {
        setLoading(true);
        try {
          // Fetch game-type-specific stats
          const res = await fetch(
            `/api/ranked/leaderboard?gameType=${gameType}&mode=games&limit=1`
          );

          if (res.ok) {
            const data = await res.json();
            const userStats = data.userGameStats;

            if (userStats) {
              const rank = userStats.rank;
              const totalGames = userStats.totalGamesCount || 0;
              const topPercentage =
                rank && totalGames > 0
                  ? Math.ceil((rank / totalGames) * 100)
                  : null;

              setRankData({
                rank,
                totalPlayers: totalGames,
                topPercentage,
                bestScore: userStats.bestScore || 0,
                totalScore: userStats.totalScore || 0,
              });
            } else {
              setRankData({
                rank: null,
                totalPlayers: 0,
                topPercentage: null,
                bestScore: 0,
                totalScore: 0,
              });
            }
          }
        } catch (error) {
          console.error("Error fetching player rank:", error);
          setRankData(null);
        } finally {
          setLoading(false);
        }
      };

      fetchPlayerRank();
    } else {
      setLoading(false);
      setRankData(null);
    }
  }, [status, session, gameType]);

  return {
    rankData,
    loading,
    isAuthenticated: status === "authenticated",
  };
}
