"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, MedalBadge } from "@/components/ui/Badge";
import { Swords, Trophy, Info } from "lucide-react";
import MissionControlBackground from "@/components/MissionControlBackground";
import { PodiumLeaderboard } from "@/app/[locale]/guesser/[gameType]/components";
import type { DuelRankingEntry } from "@/app/[locale]/guesser/[gameType]/hooks/useDuelRankings";

interface DuelLeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userImage: string | null;
  wins: number;
  losses: number;
  totalDuels: number;
  winRate: number;
  duelPoints: number;
}

const labels = {
  de: {
    title: "Duell-Champions",
    subtitle: "Die besten Spielerinnen und Spieler aller Zeiten",
    rank: "Rang",
    player: "Spieler",
    points: "Punkte",
    wins: "Siege",
    losses: "Niederlagen",
    duels: "Duelle",
    winRate: "Siegrate",
    noData: "Noch keine Duelle gespielt",
    back: "Zurück",
    loading: "Lade Rangliste...",
    scoringInfo: "Sieg gegen stärkeren Gegner: +3 Punkte + 3 Bonus = 6\nSieg gegen schwächeren Gegner: +3 Punkte, kein Bonus\nNiederlage: 0 Punkte",
  },
  en: {
    title: "Duel Champions",
    subtitle: "The best duelists of all time",
    rank: "Rank",
    player: "Player",
    points: "Points",
    wins: "Wins",
    losses: "Losses",
    duels: "Duels",
    winRate: "Win Rate",
    noData: "No duels played yet",
    back: "Back",
    loading: "Loading leaderboard...",
    scoringInfo: "Win vs stronger opponent: +3 points + 3 bonus = 6\nWin vs weaker opponent: +3 points, no bonus\nLoss: 0 points",
  },
  sl: {
    title: "Prvaki dvobojev",
    subtitle: "Najboljši dvobojniki vseh časov",
    rank: "Uvrstitev",
    player: "Igralec",
    points: "Točke",
    wins: "Zmage",
    losses: "Porazi",
    duels: "Dvoboji",
    winRate: "Stopnja zmag",
    noData: "Še ni odigranih dvobojev",
    back: "Nazaj",
    loading: "Nalagam lestvico...",
    scoringInfo: "Zmaga proti močnejšemu: +3 točke + 3 bonus = 6\nZmaga proti šibkejšemu: +3 točke, brez bonusa\nPoraz: 0 točk",
  },
};

export default function DuelLeaderboardPage() {
  const { data: session } = useSession();
  const params = useParams();
  const locale = (params.locale as string) || "de";

  const t = labels[locale as keyof typeof labels] || labels.de;

  const [leaderboard, setLeaderboard] = useState<DuelLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/ranked/leaderboard/duel`);
        if (response.ok) {
          const data = await response.json();
          setLeaderboard(data.leaderboard || []);
        }
      } catch (error) {
        console.error("Error fetching duel leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Convert to DuelRankingEntry for PodiumLeaderboard
  const podiumRankings: DuelRankingEntry[] = leaderboard.slice(0, 10).map((entry) => ({
    rank: entry.rank,
    userId: entry.userId,
    userName: entry.userName,
    userImage: entry.userImage,
    wins: entry.wins,
    losses: entry.losses,
    totalDuels: entry.totalDuels,
    winRate: entry.winRate,
    duelPoints: entry.duelPoints,
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
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground font-heading">
                {t.title}
              </h1>
              <p className="text-text-muted flex items-center gap-1.5">
                {t.subtitle}
                <span className="relative group">
                  <Info className="w-4 h-4 text-text-muted/60 hover:text-accent cursor-help transition-colors" />
                  <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 p-3 rounded-lg bg-surface-1 border border-glass-border shadow-xl text-xs text-text-secondary whitespace-pre-line opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    {t.scoringInfo}
                  </span>
                </span>
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
            variant="duel"
          />
        </div>

        {/* Remaining Rankings (4+) */}
        {!loading && remainingEntries.length > 0 && (
          <Card variant="elevated" padding="none">
            <CardHeader className="border-b border-glass-border p-4">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-accent" />
                <CardTitle className="text-lg">{t.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-glass-border">
                {/* Header Row */}
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-surface-2/50 text-xs font-semibold text-text-muted uppercase tracking-wide">
                  <div className="col-span-1">{t.rank}</div>
                  <div className="col-span-4">{t.player}</div>
                  <div className="col-span-2 text-center">{t.points}</div>
                  <div className="col-span-2 text-center">{t.wins}</div>
                  <div className="col-span-1 text-center">{t.losses}</div>
                  <div className="col-span-2 text-center">{t.winRate}</div>
                </div>

                {/* Data Rows (Rank 4+) */}
                {remainingEntries.map((entry) => {
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
                        <span className="text-text-muted font-medium">{entry.rank}</span>
                      </div>

                      {/* Player */}
                      <div className="col-span-4 flex items-center gap-3">
                        <Avatar
                          src={entry.userImage || undefined}
                          name={entry.userName}
                          size="sm"
                        />
                        <span className={`font-medium ${isCurrentUser ? "text-primary" : "text-text-primary"}`}>
                          {entry.userName}
                        </span>
                        {isCurrentUser && (
                          <Badge variant="primary" size="sm">Du</Badge>
                        )}
                      </div>

                      {/* Points */}
                      <div className="col-span-2 text-center">
                        <span className="font-bold text-accent text-lg">{entry.duelPoints}</span>
                      </div>

                      {/* Wins */}
                      <div className="col-span-2 text-center">
                        <span className="font-bold text-success">{entry.wins}</span>
                      </div>

                      {/* Losses */}
                      <div className="col-span-1 text-center">
                        <span className="text-error">{entry.losses}</span>
                      </div>

                      {/* Win Rate */}
                      <div className="col-span-2 text-center">
                        <Badge
                          variant={entry.winRate >= 0.6 ? "success" : entry.winRate >= 0.4 ? "warning" : "default"}
                          size="sm"
                        >
                          {Math.round(entry.winRate * 100)}%
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
            <Swords className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{t.noData}</p>
          </div>
        )}
      </div>
    </div>
  );
}
