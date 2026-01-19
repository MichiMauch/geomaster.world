"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, MedalBadge } from "@/components/ui/Badge";
import { Swords, Trophy, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface DuelLeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userImage: string | null;
  wins: number;
  losses: number;
  totalDuels: number;
  winRate: number;
}

const labels = {
  de: {
    title: "Duell-Champions",
    subtitle: "Die besten Duellanten aller Zeiten",
    rank: "Rang",
    player: "Spieler",
    wins: "Siege",
    losses: "Niederlagen",
    duels: "Duelle",
    winRate: "Siegrate",
    noData: "Noch keine Duelle gespielt",
    back: "Zurück",
    loading: "Lade Rangliste...",
  },
  en: {
    title: "Duel Champions",
    subtitle: "The best duelists of all time",
    rank: "Rank",
    player: "Player",
    wins: "Wins",
    losses: "Losses",
    duels: "Duels",
    winRate: "Win Rate",
    noData: "No duels played yet",
    back: "Back",
    loading: "Loading leaderboard...",
  },
  sl: {
    title: "Prvaki dvobojev",
    subtitle: "Najboljši dvobojniki vseh časov",
    rank: "Uvrstitev",
    player: "Igralec",
    wins: "Zmage",
    losses: "Porazi",
    duels: "Dvoboji",
    winRate: "Stopnja zmag",
    noData: "Še ni odigranih dvobojev",
    back: "Nazaj",
    loading: "Nalagam lestvico...",
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

  return (
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
            <p className="text-text-muted">
              {t.subtitle}
            </p>
          </div>
        </div>

        <Link href={`/${locale}/guesser`}>
          <Button variant="ghost" size="sm" className="text-text-muted">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.back}
          </Button>
        </Link>
      </div>

      {/* Leaderboard */}
      <Card variant="elevated" padding="none">
        <CardHeader className="border-b border-glass-border p-4">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-accent" />
            <CardTitle className="text-lg">{t.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-text-muted">{t.loading}</span>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <Swords className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t.noData}</p>
            </div>
          ) : (
            <div className="divide-y divide-glass-border">
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-surface-2/50 text-xs font-semibold text-text-muted uppercase tracking-wide">
                <div className="col-span-1">{t.rank}</div>
                <div className="col-span-5">{t.player}</div>
                <div className="col-span-2 text-center">{t.wins}</div>
                <div className="col-span-2 text-center">{t.losses}</div>
                <div className="col-span-2 text-center">{t.winRate}</div>
              </div>

              {/* Data Rows */}
              {leaderboard.map((entry, index) => {
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
                      {entry.rank <= 3 ? (
                        <MedalBadge position={entry.rank as 1 | 2 | 3} />
                      ) : (
                        <span className="text-text-muted font-medium">{entry.rank}</span>
                      )}
                    </div>

                    {/* Player */}
                    <div className="col-span-5 flex items-center gap-3">
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

                    {/* Wins */}
                    <div className="col-span-2 text-center">
                      <span className="font-bold text-success">{entry.wins}</span>
                    </div>

                    {/* Losses */}
                    <div className="col-span-2 text-center">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
