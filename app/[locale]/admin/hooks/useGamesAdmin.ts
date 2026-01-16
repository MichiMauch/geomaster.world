"use client";

import { useState, useCallback } from "react";
import toast from "react-hot-toast";

// Types
export interface GuessWithScoring {
  id: string;
  userId: string;
  userName: string | null;
  userImage: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number;
  timeSeconds: number | null;
  baseScore: number;
  timeMultiplier: number;
  calculatedScore: number;
  createdAt: string | null;
}

export interface GameRoundWithGuesses {
  id: string;
  roundNumber: number;
  locationIndex: number;
  locationId: string;
  locationName: string;
  locationSource: string;
  gameType: string;
  timeLimitSeconds: number | null;
  guesses: GuessWithScoring[];
}

export interface GameWithDetails {
  id: string;
  gameType: string | null;
  mode: "group" | "training" | "ranked";
  status: "active" | "completed";
  userId: string | null;
  userName: string | null;
  userImage: string | null;
  groupId: string | null;
  groupName: string | null;
  scoringVersion: number;
  createdAt: string | null;
  locationsPerRound: number;
  timeLimitSeconds: number;
  rounds: GameRoundWithGuesses[];
}

export interface GamesFilters {
  mode?: "group" | "training" | "ranked";
  gameType?: string;
  status?: "active" | "completed";
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UseGamesAdminReturn {
  games: GameWithDetails[];
  filters: GamesFilters;
  pagination: Pagination;
  loading: boolean;
  setFilters: (filters: GamesFilters) => void;
  setPage: (page: number) => void;
  fetchGames: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useGamesAdmin(): UseGamesAdminReturn {
  const [games, setGames] = useState<GameWithDetails[]>([]);
  const [filters, setFiltersState] = useState<GamesFilters>({});
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", pagination.page.toString());
      params.set("limit", pagination.limit.toString());

      if (filters.mode) params.set("mode", filters.mode);
      if (filters.gameType) params.set("gameType", filters.gameType);
      if (filters.status) params.set("status", filters.status);
      if (filters.userId) params.set("userId", filters.userId);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);

      const response = await fetch(`/api/admin/games?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch games");
      }

      const data = await response.json();
      setGames(data.games);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
      }));
    } catch (error) {
      console.error("Error fetching games:", error);
      toast.error("Fehler beim Laden der Spiele");
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  const setFilters = useCallback((newFilters: GamesFilters) => {
    setFiltersState(newFilters);
    // Reset to page 1 when filters change
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const refresh = useCallback(async () => {
    await fetchGames();
    toast.success("Spiele aktualisiert");
  }, [fetchGames]);

  return {
    games,
    filters,
    pagination,
    loading,
    setFilters,
    setPage,
    fetchGames,
    refresh,
  };
}
