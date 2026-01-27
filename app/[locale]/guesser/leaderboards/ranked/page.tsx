"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Trophy, Target } from "lucide-react";
import MissionControlBackground from "@/components/MissionControlBackground";
import { PodiumLeaderboard } from "@/app/[locale]/guesser/[gameType]/components";
import type { RankingEntry } from "@/app/[locale]/guesser/[gameType]/types";

interface RankedLeaderboardEntry {
  rank: number;
  userId: string;
  userName: string | null;
  userImage: string | null;
  totalScore: number;
  totalGames: number;
  averageScore: number;
  bestScore: number;
}

const labels = {
  de: {
    title: "Ranked Champions",
    subtitle: "Die besten Spielerinnen und Spieler aller Zeiten",
    rank: "Rang",
    player: "Spieler",
    totalScore: "Gesamtpunkte",
    games: "Spiele",
    bestScore: "Best Score",
    avgScore: "Ø Score",
    noData: "Noch keine Spiele gespielt",
    back: "Zurück",
    loading: "Lade Rangliste...",
  },
  en: {
    title: "Ranked Champions",
    subtitle: "The best players of all time",
    rank: "Rank",
    player: "Player",
    totalScore: "Total Score",
    games: "Games",
    bestScore: "Best Score",
    avgScore: "Avg Score",
    noData: "No games played yet",
    back: "Back",
    loading: "Loading leaderboard...",
  },
  sl: {
    title: "Prvaki rangiranih iger",
    subtitle: "Najboljši igralci vseh časov",
    rank: "Uvrstitev",
    player: "Igralec",
    totalScore: "Skupne točke",
    games: "Igre",
    bestScore: "Najboljši rezultat",
    avgScore: "Povp. rezultat",
    noData: "Še ni odigranih iger",
    back: "Nazaj",
    loading: "Nalagam lestvico...",
  },
};

export default function RankedLeaderboardPage() {
  const { data: session } = useSession();
  const params = useParams();
  const locale = (params.locale as string) || "de";

  const t = labels[locale as keyof typeof labels] || labels.de;

  const [leaderboard, setLeaderboard] = useState<RankedLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/ranked/leaderboard?gameType=overall&period=alltime&sortBy=total&limit=100`
        );
        if (response.ok) {
          const data = await response.json();
          setLeaderboard(data.rankings || []);
        }
      } catch (error) {
        console.error("Error fetching ranked leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Convert to RankingEntry for PodiumLeaderboard
  // Map totalScore into bestScore so the podium displays totalScore
  const podiumRankings: RankingEntry[] = leaderboard.slice(0, 10).map((entry, index) => ({
    rank: index + 1,
    userName: entry.userName,
    userImage: entry.userImage,
    bestScore: entry.totalScore, // Podium displays bestScore, so we map totalScore here
    totalScore: entry.totalScore,
    totalGames: entry.totalGames,
  }));

  const remainingEntries = leaderboard.slice(3);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: 'url("/images/hero-map-bg.jpg")',
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-transparent" />
        <MissionControlBackground />
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground font-heading">
                {t.title}
              </h1>
              <p className="text-text-muted">
                {t.subtitle}
              </p>
            </div>
          </div>

        </div>

        {/* Podium (Top 3) */}
        <div className="mb-8">
          <PodiumLeaderboard
            rankings={podiumRankings}
            loading={loading}
            locale={locale}
            showPodium={true}
            showList={false}
            variant="solo"
          />
        </div>

        {/* Remaining Rankings (4+) */}
        {!loading && remainingEntries.length > 0 && (
          <Card variant="elevated" padding="none">
            <CardHeader className="border-b border-glass-border p-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">{t.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-glass-border">
                {/* Header Row */}
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-surface-2/50 text-xs font-semibold text-text-muted uppercase tracking-wide">
                  <div className="col-span-1">{t.rank}</div>
                  <div className="col-span-4">{t.player}</div>
                  <div className="col-span-2 text-center">{t.totalScore}</div>
                  <div className="col-span-2 text-center">{t.games}</div>
                  <div className="col-span-1 text-center">{t.bestScore}</div>
                  <div className="col-span-2 text-center">{t.avgScore}</div>
                </div>

                {/* Data Rows (Rank 4+) */}
                {remainingEntries.map((entry, index) => {
                  const isCurrentUser = session?.user?.id === entry.userId;

                  return (
                    <div
                      key={entry.userId}
                      className={`grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors ${
                        isCurrentUser ? "bg-primary/10" : "hover:bg-surface-2/30"
                      }`}
                    >
                      {/* Rank */}
                      <div className="col-span-1">
                        <span className="text-text-muted font-medium">{index + 4}</span>
                      </div>

                      {/* Player */}
                      <div className="col-span-4 flex items-center gap-3">
                        <Avatar
                          src={entry.userImage || undefined}
                          name={entry.userName || "?"}
                          size="sm"
                        />
                        <span className={`font-medium ${isCurrentUser ? "text-primary" : "text-text-primary"}`}>
                          {entry.userName || "Anonym"}
                        </span>
                        {isCurrentUser && (
                          <Badge variant="primary" size="sm">Du</Badge>
                        )}
                      </div>

                      {/* Total Score */}
                      <div className="col-span-2 text-center">
                        <span className="font-bold text-primary text-lg">{entry.totalScore.toLocaleString()}</span>
                      </div>

                      {/* Games */}
                      <div className="col-span-2 text-center">
                        <span className="font-bold text-foreground">{entry.totalGames}</span>
                      </div>

                      {/* Best Score */}
                      <div className="col-span-1 text-center">
                        <span className="text-foreground">{entry.bestScore.toLocaleString()}</span>
                      </div>

                      {/* Average Score */}
                      <div className="col-span-2 text-center">
                        <Badge
                          variant={entry.averageScore >= 400 ? "success" : entry.averageScore >= 250 ? "warning" : "default"}
                          size="sm"
                        >
                          {Math.round(entry.averageScore)}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state (no data at all) */}
        {!loading && leaderboard.length === 0 && (
          <div className="text-center py-12 text-text-muted">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{t.noData}</p>
          </div>
        )}
      </div>
    </div>
  );
}
