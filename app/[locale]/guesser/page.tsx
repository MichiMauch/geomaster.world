"use client";

import { useSession, signIn } from "next-auth/react";
import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import GameTypeSelectorWithLeaders from "@/components/guesser/GameTypeSelectorWithLeaders";

interface UserStats {
  totalGames: number;
  bestScore: number;
  averageScore: number;
  bestRank: number | null;
  gameTypeBreakdown: Record<string, { games: number; bestScore: number; avgScore: number }>;
}

interface UserRankings {
  [gameType: string]: { rank: number; bestScore: number };
}

export default function GuesserPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations("ranked");

  const [stats, setStats] = useState<UserStats | null>(null);
  const [userRankings, setUserRankings] = useState<UserRankings>({});
  const [globalRank, setGlobalRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (session?.user) {
          // Fetch user stats
          const statsRes = await fetch("/api/ranked/stats");
          if (statsRes.ok) {
            const { stats: userStats } = await statsRes.json();
            setStats(userStats);
          }

          // Get alltime rank
          const allTimeRes = await fetch("/api/ranked/leaderboard?gameType=overall&period=alltime&limit=1");
          if (allTimeRes.ok) {
            const data = await allTimeRes.json();
            if (data.userRank) {
              setGlobalRank(data.userRank.rank);
            }
          }

          // Get rankings per game type
          const gameTypes = ["country:switzerland", "country:slovenia", "world:highest-mountains", "world:capitals", "world:famous-places", "world:unesco", "world:airports"];
          const rankings: UserRankings = {};

          await Promise.all(gameTypes.map(async (gameType) => {
            const res = await fetch(`/api/ranked/leaderboard?gameType=${gameType}&period=alltime&limit=1`);
            if (res.ok) {
              const data = await res.json();
              if (data.userRank) {
                rankings[gameType] = {
                  rank: data.userRank.rank,
                  bestScore: data.userRank.bestScore
                };
              }
            }
          }));

          setUserRankings(rankings);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (status !== "loading") {
      fetchData();
    }
  }, [session, status]);

  const handleLogin = () => {
    signIn("google");
  };

  const gameTypeNames: Record<string, Record<string, string>> = {
    "country:switzerland": { de: "Schweiz", en: "Switzerland", sl: "Švica" },
    "country:slovenia": { de: "Slowenien", en: "Slovenia", sl: "Slovenija" },
    "world:highest-mountains": { de: "Höchste Berge", en: "Highest Mountains", sl: "Najvišje gore" },
    "world:capitals": { de: "Hauptstädte", en: "Capitals", sl: "Glavna mesta" },
    "world:famous-places": { de: "Berühmte Orte", en: "Famous Places", sl: "Znana mesta" },
    "world:unesco": { de: "UNESCO", en: "UNESCO", sl: "UNESCO" },
    "world:airports": { de: "Flughäfen", en: "Airports", sl: "Letališča" },
  };

  const getGameTypeName = (id: string) => {
    return gameTypeNames[id]?.[locale] || id;
  };

  return (
    <div className="relative min-h-screen">
      {/* Background with world map */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: 'url("/images/hero-map-bg.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-transparent" />
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-4">
        {/* Guest Login Prompt */}
      {status === "unauthenticated" && (
        <div className="flex items-center justify-between gap-4 mb-6 p-3 bg-primary/5 border border-primary/20 rounded-sm">
          <p className="text-sm text-foreground">
            {t("loginPrompt", { defaultValue: "Melde dich an für Rankings!" })}
          </p>
          <Button onClick={handleLogin} variant="primary" size="sm">
            {t("login", { defaultValue: "Anmelden" })}
          </Button>
        </div>
      )}

      {/* Main Content: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Game Types (3 cols) */}
        <div className="lg:col-span-3">
          <GameTypeSelectorWithLeaders
            navigationMode={true}
            excludeImageTypes={true}
            basePath="/guesser"
          />
        </div>

        {/* Right: User Rankings (1 col) */}
        {status === "authenticated" && session?.user && (
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                {locale === "de" ? "Deine Rankings" : locale === "en" ? "Your Rankings" : "Tvoje uvrstitve"}
              </h3>

              {/* User Stats Summary */}
              {loading ? (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-surface-2 rounded-sm animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 bg-surface-2 rounded-sm">
                    <div className="text-lg font-bold text-foreground">{stats?.totalGames ?? 0}</div>
                    <div className="text-xs text-muted-foreground">
                      {locale === "de" ? "Spiele" : locale === "en" ? "Games" : "Igre"}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-surface-2 rounded-sm">
                    <div className="text-lg font-bold text-foreground">{stats?.bestScore ?? 0}</div>
                    <div className="text-xs text-muted-foreground">
                      {locale === "de" ? "Best" : locale === "en" ? "Best" : "Najboljši"}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-surface-2 rounded-sm">
                    <div className="text-lg font-bold text-primary">
                      {globalRank ? `#${globalRank}` : "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {locale === "de" ? "Rang" : locale === "en" ? "Rank" : "Uvrstitev"}
                    </div>
                  </div>
                </div>
              )}

              {/* Per-Game Rankings */}
              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-8 bg-surface-2 rounded-sm animate-pulse" />
                  ))}
                </div>
              ) : Object.keys(userRankings).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {locale === "de" ? "Noch keine Rankings" : locale === "en" ? "No rankings yet" : "Še brez uvrstitev"}
                </p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(userRankings).map(([gameType, data]) => (
                    <div key={gameType} className="flex items-center justify-between py-1.5 border-b border-surface-3 last:border-0">
                      <span className="text-sm text-foreground truncate">
                        {getGameTypeName(gameType)}
                      </span>
                      <span className="text-sm font-bold text-primary ml-2">
                        #{data.rank}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
