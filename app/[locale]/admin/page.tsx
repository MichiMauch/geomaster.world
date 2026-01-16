"use client";

import { useEffect, useState } from "react";
import { MapPin, Globe, Image, Users, UsersRound, Gamepad2, ScrollText, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface DashboardStats {
  countries: number;
  worldQuizTypes: number;
  locations: number;
  worldLocations: number;
  users: number;
  groups: number;
  games: number;
  logsToday: number;
}

export default function AdminDashboard() {
  const params = useParams();
  const locale = params.locale as string;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [countriesRes, worldQuizRes, usersRes, groupsRes, logsRes] = await Promise.all([
          fetch("/api/countries"),
          fetch("/api/world-quiz-types"),
          fetch("/api/admin/users"),
          fetch("/api/admin/groups"),
          fetch("/api/admin/logs/stats"),
        ]);

        const countries = await countriesRes.json();
        const worldQuiz = await worldQuizRes.json();
        const users = await usersRes.json();
        const groups = await groupsRes.json();
        const logsStats = await logsRes.json();

        const totalLocations = countries.reduce((sum: number, c: { locationCount?: number }) => sum + (c.locationCount || 0), 0);
        const totalWorldLocations = worldQuiz.reduce((sum: number, w: { locationCount?: number }) => sum + (w.locationCount || 0), 0);

        setStats({
          countries: countries.length,
          worldQuizTypes: worldQuiz.length,
          locations: totalLocations,
          worldLocations: totalWorldLocations,
          users: users.length,
          groups: groups.length,
          games: 0, // Would need separate endpoint
          logsToday: logsStats.errorsToday + logsStats.warningsToday,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const cards = [
    {
      title: "Länder",
      value: stats?.countries ?? "-",
      subtitle: `${stats?.locations ?? 0} Orte`,
      icon: <MapPin className="w-6 h-6" />,
      href: `/${locale}/admin/content/countries`,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      title: "Welt-Quizze",
      value: stats?.worldQuizTypes ?? "-",
      subtitle: `${stats?.worldLocations ?? 0} Orte`,
      icon: <Globe className="w-6 h-6" />,
      href: `/${locale}/admin/content/world`,
      color: "text-green-400",
      bgColor: "bg-green-400/10",
    },
    {
      title: "Benutzer",
      value: stats?.users ?? "-",
      subtitle: "registriert",
      icon: <Users className="w-6 h-6" />,
      href: `/${locale}/admin/users`,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
    },
    {
      title: "Gruppen",
      value: stats?.groups ?? "-",
      subtitle: "erstellt",
      icon: <UsersRound className="w-6 h-6" />,
      href: `/${locale}/admin/users/groups`,
      color: "text-orange-400",
      bgColor: "bg-orange-400/10",
    },
    {
      title: "Logs heute",
      value: stats?.logsToday ?? "-",
      subtitle: "Fehler & Warnungen",
      icon: <ScrollText className="w-6 h-6" />,
      href: `/${locale}/admin/analytics/logs`,
      color: stats?.logsToday && stats.logsToday > 0 ? "text-red-400" : "text-gray-400",
      bgColor: stats?.logsToday && stats.logsToday > 0 ? "bg-red-400/10" : "bg-gray-400/10",
    },
    {
      title: "Spiele",
      value: "→",
      subtitle: "Übersicht",
      icon: <Gamepad2 className="w-6 h-6" />,
      href: `/${locale}/admin/analytics/games`,
      color: "text-cyan-400",
      bgColor: "bg-cyan-400/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary">Übersicht über GeoMaster World</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-6 rounded-xl bg-surface-2 border border-glass-border animate-pulse">
              <div className="h-6 w-20 bg-surface-3 rounded mb-4" />
              <div className="h-8 w-16 bg-surface-3 rounded mb-2" />
              <div className="h-4 w-24 bg-surface-3 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="p-6 rounded-xl bg-surface-2 border border-glass-border hover:border-primary/50 transition-colors group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <span className={card.color}>{card.icon}</span>
                </div>
                <TrendingUp className="w-4 h-4 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-3xl font-bold text-text-primary mb-1">{card.value}</div>
              <div className="text-sm text-text-secondary">{card.title}</div>
              <div className="text-xs text-text-tertiary mt-1">{card.subtitle}</div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="p-6 rounded-xl bg-surface-2 border border-glass-border">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Schnellzugriff</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/${locale}/admin/content/countries`}
            className="px-4 py-2 rounded-lg bg-surface-3 text-text-secondary hover:text-text-primary hover:bg-surface-4 transition-colors text-sm"
          >
            + Land hinzufügen
          </Link>
          <Link
            href={`/${locale}/admin/content/world`}
            className="px-4 py-2 rounded-lg bg-surface-3 text-text-secondary hover:text-text-primary hover:bg-surface-4 transition-colors text-sm"
          >
            + Welt-Quiz hinzufügen
          </Link>
          <Link
            href={`/${locale}/admin/analytics/logs`}
            className="px-4 py-2 rounded-lg bg-surface-3 text-text-secondary hover:text-text-primary hover:bg-surface-4 transition-colors text-sm"
          >
            Logs prüfen
          </Link>
        </div>
      </div>
    </div>
  );
}
