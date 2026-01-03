"use client";

import { useSession, signIn } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import GameTypeSelectorWithLeaders from "@/components/guesser/GameTypeSelectorWithLeaders";

interface UserStats {
  totalGames: number;
  bestScore: number;
  totalScore: number;
  averageScore: number;
  bestRank: number | null;
  gameTypeBreakdown: Record<string, { games: number; bestScore: number; totalScore: number; avgScore: number }>;
}

export default function GuesserPage() {
  const { data: session, status } = useSession();
  const locale = useLocale();
  const t = useTranslations("ranked");

  const [stats, setStats] = useState<UserStats | null>(null);
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

        {/* Right: User Stats (1 col) */}
        {status === "authenticated" && session?.user && (
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                {locale === "de" ? "Deine Stats" : locale === "en" ? "Your Stats" : "Tvoje statistike"}
              </h3>

              {/* User Stats Summary */}
              {loading ? (
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-surface-2 rounded-sm animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
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
                      {(stats?.totalScore ?? 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {locale === "de" ? "Total" : locale === "en" ? "Total" : "Skupaj"}
                    </div>
                  </div>
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
