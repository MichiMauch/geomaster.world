import { useState, useCallback } from "react";
import toast from "react-hot-toast";

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogCategory = "auth" | "game" | "admin" | "system";

export interface ActivityLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  action: string;
  userId: string | null;
  targetId: string | null;
  targetType: string | null;
  details: string | null;
  metadata: string | null;
  userName: string | null;
  userImage: string | null;
}

export interface LogFilters {
  level?: LogLevel;
  category?: LogCategory;
  userId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface LogStats {
  totalLogs: number;
  errorsToday: number;
  warningsToday: number;
  logsByDay: Array<{ date: string; count: number; errors: number }>;
  activityByCategory: Array<{ category: string; count: number }>;
  levelDistribution: Array<{ level: string; count: number }>;
  topUsers: Array<{ userId: string; userName: string | null; userImage: string | null; count: number }>;
  topActions: Array<{ action: string; count: number }>;
  dateRange: { start: string; end: string };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UseLogsAdminReturn {
  logs: ActivityLog[];
  stats: LogStats | null;
  filters: LogFilters;
  pagination: Pagination;
  loading: boolean;
  statsLoading: boolean;
  setFilters: (filters: LogFilters) => void;
  setPage: (page: number) => void;
  fetchLogs: () => Promise<void>;
  fetchStats: () => Promise<void>;
  deleteLogs: (before?: string, all?: boolean) => Promise<number>;
  refresh: () => Promise<void>;
}

export function useLogsAdmin(): UseLogsAdminReturn {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [filters, setFiltersState] = useState<LogFilters>({});
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  const buildQueryString = useCallback((page: number, currentFilters: LogFilters) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(pagination.limit));

    if (currentFilters.level) params.set("level", currentFilters.level);
    if (currentFilters.category) params.set("category", currentFilters.category);
    if (currentFilters.userId) params.set("userId", currentFilters.userId);
    if (currentFilters.startDate) params.set("startDate", currentFilters.startDate);
    if (currentFilters.endDate) params.set("endDate", currentFilters.endDate);
    if (currentFilters.search) params.set("search", currentFilters.search);

    return params.toString();
  }, [pagination.limit]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const query = buildQueryString(pagination.page, filters);
      const res = await fetch(`/api/admin/logs?${query}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setPagination(data.pagination);
      } else {
        toast.error("Fehler beim Laden der Logs");
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("Fehler beim Laden der Logs");
    } finally {
      setLoading(false);
    }
  }, [buildQueryString, filters, pagination.page]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);

      const res = await fetch(`/api/admin/logs/stats?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        toast.error("Fehler beim Laden der Statistiken");
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Fehler beim Laden der Statistiken");
    } finally {
      setStatsLoading(false);
    }
  }, [filters.startDate, filters.endDate]);

  const setFilters = useCallback((newFilters: LogFilters) => {
    setFiltersState(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1 when filters change
  }, []);

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const deleteLogs = useCallback(async (before?: string, all?: boolean): Promise<number> => {
    const confirmMessage = all
      ? "Wirklich ALLE Logs löschen? Diese Aktion kann nicht rückgängig gemacht werden!"
      : `Alle Logs vor ${before} löschen?`;

    if (!confirm(confirmMessage)) {
      return 0;
    }

    try {
      const res = await fetch("/api/admin/logs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(all ? { all: true } : { before }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`${data.deleted} Logs gelöscht`);
        // Refresh logs and stats
        await fetchLogs();
        await fetchStats();
        return data.deleted;
      } else {
        toast.error("Fehler beim Löschen");
        return 0;
      }
    } catch {
      toast.error("Fehler beim Löschen");
      return 0;
    }
  }, [fetchLogs, fetchStats]);

  const refresh = useCallback(async () => {
    await Promise.all([fetchLogs(), fetchStats()]);
  }, [fetchLogs, fetchStats]);

  return {
    logs,
    stats,
    filters,
    pagination,
    loading,
    statsLoading,
    setFilters,
    setPage,
    fetchLogs,
    fetchStats,
    deleteLogs,
    refresh,
  };
}
