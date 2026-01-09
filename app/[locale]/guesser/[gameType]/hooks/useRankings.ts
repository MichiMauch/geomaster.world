"use client";

import { useState, useEffect, useCallback } from "react";
import type { RankingEntry, TabType, UserGameStats } from "../types";
import { ITEMS_PER_PAGE } from "../constants";

export function useRankings(gameType: string) {
  const [activeTab, setActiveTab] = useState<TabType>("best");
  const [currentPage, setCurrentPage] = useState(1);
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userGameStats, setUserGameStats] = useState<UserGameStats | null>(null);

  // Fetch rankings based on active tab and page
  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      try {
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;
        let url = "";

        switch (activeTab) {
          case "weekly":
            // Individual games this week (player can appear multiple times)
            url = `/api/ranked/leaderboard?gameType=${gameType}&mode=games&period=weekly&limit=${ITEMS_PER_PAGE}&offset=${offset}`;
            break;
          case "best":
            // Individual games all time (player can appear multiple times)
            url = `/api/ranked/leaderboard?gameType=${gameType}&mode=games&limit=${ITEMS_PER_PAGE}&offset=${offset}`;
            break;
          case "total":
            // Aggregated player totals (one entry per player)
            url = `/api/ranked/leaderboard?gameType=${gameType}&period=alltime&sortBy=total&limit=${ITEMS_PER_PAGE}&offset=${offset}`;
            break;
        }

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setRankings(data.rankings || []);
          setTotalCount(data.total || data.rankings?.length || 0);
          if (data.userGameStats !== undefined) {
            setUserGameStats(data.userGameStats);
          } else {
            setUserGameStats(null);
          }
        }
      } catch (error) {
        console.error("Error fetching rankings:", error);
      } finally {
        setLoading(false);
      }
    };

    if (gameType) {
      fetchRankings();
    }
  }, [gameType, activeTab, currentPage]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setCurrentPage(1);
  }, []);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return {
    activeTab,
    currentPage,
    setCurrentPage,
    rankings,
    totalPages,
    loading,
    userGameStats,
    handleTabChange,
  };
}
