"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Trash2, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useLogsAdmin, type LogLevel, type LogCategory, type ActivityLog } from "../hooks/useLogsAdmin";

// Colors for charts
const COLORS = {
  error: "#ef4444",
  warn: "#f59e0b",
  info: "#3b82f6",
  debug: "#6b7280",
  auth: "#10b981",
  game: "#8b5cf6",
  admin: "#f59e0b",
  system: "#6b7280",
};

const LEVEL_BADGES: Record<LogLevel, { variant: "error" | "warning" | "primary" | "default"; label: string }> = {
  error: { variant: "error", label: "ERROR" },
  warn: { variant: "warning", label: "WARN" },
  info: { variant: "primary", label: "INFO" },
  debug: { variant: "default", label: "DEBUG" },
};

const CATEGORY_LABELS: Record<LogCategory, string> = {
  auth: "Auth",
  game: "Game",
  admin: "Admin",
  system: "System",
};

export function LogsTab() {
  const {
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
  } = useLogsAdmin();

  const [searchInput, setSearchInput] = useState("");
  const [deleteDate, setDeleteDate] = useState("");

  // Initial fetch
  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [fetchLogs, fetchStats]);

  // Re-fetch when page changes
  useEffect(() => {
    fetchLogs();
  }, [pagination.page, fetchLogs]);

  const handleFilterChange = (key: string, value: string | undefined) => {
    setFilters({ ...filters, [key]: value || undefined });
  };

  const handleSearch = () => {
    setFilters({ ...filters, search: searchInput || undefined });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("de-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatAction = (action: string) => {
    // Remove prefix and make readable
    return action.replace(/^(auth|game|admin|system)\./, "").replace(/[._]/g, " ");
  };

  const parseDetails = (details: string | null): Record<string, unknown> | null => {
    if (!details) return null;
    try {
      return JSON.parse(details);
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="surface" padding="md">
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">
              {statsLoading ? "..." : stats?.totalLogs.toLocaleString() || 0}
            </div>
            <div className="text-sm text-muted-foreground">Total Logs (30 Tage)</div>
          </div>
        </Card>
        <Card variant="surface" padding="md">
          <div className="text-center">
            <div className="text-3xl font-bold text-error">
              {statsLoading ? "..." : stats?.errorsToday || 0}
            </div>
            <div className="text-sm text-muted-foreground">Errors heute</div>
          </div>
        </Card>
        <Card variant="surface" padding="md">
          <div className="text-center">
            <div className="text-3xl font-bold text-warning">
              {statsLoading ? "..." : stats?.warningsToday || 0}
            </div>
            <div className="text-sm text-muted-foreground">Warnings heute</div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Logs by Day */}
          <Card variant="surface" padding="md">
            <h3 className="font-semibold mb-4">Logs pro Tag</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.logsByDay}>
                <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "8px",
                  }}
                />
                <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2} name="Total" />
                <Line type="monotone" dataKey="errors" stroke={COLORS.error} strokeWidth={2} name="Errors" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Activity by Category */}
          <Card variant="surface" padding="md">
            <h3 className="font-semibold mb-4">Nach Kategorie</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.activityByCategory}>
                <XAxis dataKey="category" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" fill="var(--primary)">
                  {stats.activityByCategory.map((entry, index) => (
                    <Cell key={index} fill={COLORS[entry.category as LogCategory] || "var(--primary)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Level Distribution */}
          <Card variant="surface" padding="md">
            <h3 className="font-semibold mb-4">Level Verteilung</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={stats.levelDistribution}
                  dataKey="count"
                  nameKey="level"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {stats.levelDistribution.map((entry, index) => (
                    <Cell key={index} fill={COLORS[entry.level as LogLevel] || "#666"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Top Users */}
          <Card variant="surface" padding="md">
            <h3 className="font-semibold mb-4">Top User (Aktivität)</h3>
            <div className="space-y-2 max-h-[200px] overflow-auto">
              {stats.topUsers.map((user, index) => (
                <div key={user.userId || index} className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground w-4">{index + 1}.</span>
                  <Avatar
                    src={user.userImage}
                    name={user.userName || "?"}
                    size="sm"
                  />
                  <span className="flex-1 truncate">{user.userName || "Anonym"}</span>
                  <Badge variant="default">{user.count}</Badge>
                </div>
              ))}
              {stats.topUsers.length === 0 && (
                <p className="text-sm text-muted-foreground">Keine Daten</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card variant="surface" padding="md">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Level Filter */}
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Level</label>
            <select
              value={filters.level || ""}
              onChange={(e) => handleFilterChange("level", e.target.value)}
              className="bg-surface-2 border border-glass-border rounded px-3 py-2 text-sm"
            >
              <option value="">Alle</option>
              <option value="error">Error</option>
              <option value="warn">Warn</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Kategorie</label>
            <select
              value={filters.category || ""}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="bg-surface-2 border border-glass-border rounded px-3 py-2 text-sm"
            >
              <option value="">Alle</option>
              <option value="auth">Auth</option>
              <option value="game">Game</option>
              <option value="admin">Admin</option>
              <option value="system">System</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Von</label>
            <input
              type="date"
              value={filters.startDate || ""}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="bg-surface-2 border border-glass-border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Bis</label>
            <input
              type="date"
              value={filters.endDate || ""}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="bg-surface-2 border border-glass-border rounded px-3 py-2 text-sm"
            />
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-muted-foreground mb-1">Suche</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Action oder Details..."
                className="bg-surface-2 border border-glass-border rounded px-3 py-2 text-sm flex-1"
              />
              <Button variant="secondary" size="sm" onClick={handleSearch}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <Button variant="secondary" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </Card>

      {/* Delete Controls */}
      <Card variant="surface" padding="md">
        <div className="flex flex-wrap gap-4 items-center">
          <span className="text-sm text-muted-foreground">Logs löschen:</span>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={deleteDate}
              onChange={(e) => setDeleteDate(e.target.value)}
              className="bg-surface-2 border border-glass-border rounded px-3 py-2 text-sm"
            />
            <Button
              variant="danger"
              size="sm"
              onClick={() => deleteDate && deleteLogs(deleteDate)}
              disabled={!deleteDate}
            >
              Vor Datum löschen
            </Button>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => deleteLogs(undefined, true)}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Alle löschen
          </Button>
        </div>
      </Card>

      {/* Logs Table */}
      <Card variant="surface" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2">
              <tr>
                <th className="text-left p-3 font-medium">Zeit</th>
                <th className="text-left p-3 font-medium">Level</th>
                <th className="text-left p-3 font-medium">Kategorie</th>
                <th className="text-left p-3 font-medium">Action</th>
                <th className="text-left p-3 font-medium">User</th>
                <th className="text-left p-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Laden...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Keine Logs gefunden
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <LogRow key={log.id} log={log} formatTimestamp={formatTimestamp} formatAction={formatAction} parseDetails={parseDetails} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-glass-border">
            <span className="text-sm text-muted-foreground">
              Seite {pagination.page} von {pagination.totalPages} ({pagination.total} Einträge)
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// Separate row component for better performance
function LogRow({
  log,
  formatTimestamp,
  formatAction,
  parseDetails,
}: {
  log: ActivityLog;
  formatTimestamp: (ts: string) => string;
  formatAction: (action: string) => string;
  parseDetails: (details: string | null) => Record<string, unknown> | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const details = parseDetails(log.details);
  const levelBadge = LEVEL_BADGES[log.level];

  return (
    <>
      <tr className="hover:bg-surface-2/50 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <td className="p-3 whitespace-nowrap text-muted-foreground">
          {formatTimestamp(log.timestamp)}
        </td>
        <td className="p-3">
          <Badge variant={levelBadge.variant}>{levelBadge.label}</Badge>
        </td>
        <td className="p-3">
          <span className="text-muted-foreground">{CATEGORY_LABELS[log.category]}</span>
        </td>
        <td className="p-3 font-medium">{formatAction(log.action)}</td>
        <td className="p-3">
          {log.userName ? (
            <div className="flex items-center gap-2">
              <Avatar src={log.userImage} name={log.userName} size="sm" />
              <span className="truncate max-w-[100px]">{log.userName}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </td>
        <td className="p-3">
          {details ? (
            <span className="text-muted-foreground text-xs">
              {Object.keys(details).slice(0, 2).join(", ")}
              {Object.keys(details).length > 2 && "..."}
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </td>
      </tr>
      {expanded && details && (
        <tr>
          <td colSpan={6} className="p-4 bg-surface-2">
            <pre className="text-xs overflow-auto max-h-40 bg-background p-3 rounded">
              {JSON.stringify(details, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}
