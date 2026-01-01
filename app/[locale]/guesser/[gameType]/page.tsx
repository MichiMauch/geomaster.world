"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getGameTypeConfig } from "@/lib/game-types";
import { nanoid } from "nanoid";

interface TopPlayer {
  rank: number;
  userName: string | null;
  bestScore: number;
}

interface TotalPlayer {
  rank: number;
  userName: string | null;
  totalScore: number;
  totalGames: number;
}

export default function GuesserGameTypePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const gameType = decodeURIComponent(params.gameType as string);
  const t = useTranslations("ranked");

  // Validate game type
  const gameConfig = getGameTypeConfig(gameType);

  const [weeklyTop5, setWeeklyTop5] = useState<TopPlayer[]>([]);
  const [alltimeTop5, setAlltimeTop5] = useState<TopPlayer[]>([]);
  const [totalTop5, setTotalTop5] = useState<TotalPlayer[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creatingGame, setCreatingGame] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);

  // Initialize guestId for non-logged-in users
  useEffect(() => {
    if (!session?.user?.id) {
      const stored = localStorage.getItem("guestId");
      if (stored) {
        setGuestId(stored);
      } else {
        const newGuestId = nanoid();
        localStorage.setItem("guestId", newGuestId);
        setGuestId(newGuestId);
      }
    }
  }, [session]);

  // Redirect if invalid game type
  useEffect(() => {
    if (!gameConfig) {
      router.push(`/${locale}/guesser`);
    }
  }, [gameConfig, router, locale]);

  // Personal best score (from user stats)
  const personalBest = userStats?.gameTypeBreakdown?.[gameType]?.bestScore || 0;

  // Fetch rankings (weekly, alltime, and total)
  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      try {
        const [weeklyRes, alltimeRes, totalRes] = await Promise.all([
          fetch(`/api/ranked/leaderboard?gameType=${gameType}&period=weekly&limit=5`),
          fetch(`/api/ranked/leaderboard?gameType=${gameType}&period=alltime&limit=5`),
          fetch(`/api/ranked/leaderboard?gameType=${gameType}&period=alltime&sortBy=total&limit=5`),
        ]);

        if (weeklyRes.ok) {
          const data = await weeklyRes.json();
          setWeeklyTop5(data.rankings?.slice(0, 5) || []);
        }
        if (alltimeRes.ok) {
          const data = await alltimeRes.json();
          setAlltimeTop5(data.rankings?.slice(0, 5) || []);
        }
        if (totalRes.ok) {
          const data = await totalRes.json();
          setTotalTop5(data.rankings?.slice(0, 5).map((r: any) => ({
            rank: r.rank,
            userName: r.userName,
            totalScore: r.totalScore,
            totalGames: r.totalGames,
          })) || []);
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
  }, [gameType]);

  // Fetch user stats if logged in
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      const fetchUserStats = async () => {
        try {
          const response = await fetch(`/api/ranked/stats`);
          if (response.ok) {
            const data = await response.json();
            setUserStats(data.stats);
          }
        } catch (error) {
          console.error("Error fetching user stats:", error);
        }
      };

      fetchUserStats();
    }
  }, [status, session]);

  const handleStartGame = async () => {
    setCreatingGame(true);
    try {
      const response = await fetch("/api/ranked/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameType, guestId }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/${locale}/guesser/play/${data.gameId}`);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create game");
      }
    } catch (error) {
      console.error("Error creating game:", error);
      alert("Failed to create game");
    } finally {
      setCreatingGame(false);
    }
  };

  // Show loading or nothing while validating/redirecting
  if (!gameConfig) {
    return null;
  }

  const getRankDisplay = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}.`;
  };

  const RankingsList = ({ players, title }: { players: TopPlayer[]; title: string }) => (
    <div className="mb-4">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
        {title}
      </h4>
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-6 bg-surface-2 rounded-sm animate-pulse" />
          ))}
        </div>
      ) : players.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {locale === "de" ? "Noch keine Spieler" : locale === "en" ? "No players yet" : "Še brez igralcev"}
        </p>
      ) : (
        <div className="space-y-1">
          {players.map((player, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span className="w-5 text-center">{getRankDisplay(index)}</span>
              <span className="text-muted-foreground truncate flex-1">
                {player.userName || "Anonym"}
              </span>
              <span className="text-foreground font-medium tabular-nums">
                {player.bestScore}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const TotalRankingsList = ({ players, title }: { players: TotalPlayer[]; title: string }) => (
    <div className="mb-4">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
        {title}
      </h4>
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-6 bg-surface-2 rounded-sm animate-pulse" />
          ))}
        </div>
      ) : players.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {locale === "de" ? "Noch keine Spieler" : locale === "en" ? "No players yet" : "Še brez igralcev"}
        </p>
      ) : (
        <div className="space-y-1">
          {players.map((player, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span className="w-5 text-center">{getRankDisplay(index)}</span>
              <span className="text-muted-foreground truncate flex-1">
                {player.userName || "Anonym"}
              </span>
              <span className="text-foreground font-medium tabular-nums">
                {player.totalScore.toLocaleString()}
              </span>
              <span className="text-muted-foreground text-xs">
                ({player.totalGames})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

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

      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Game Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-surface-1 border border-surface-3 rounded-sm p-6">
              {/* Header with Icon + Name */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-5xl">{gameConfig.icon}</span>
                <h1 className="text-3xl font-bold text-foreground">
                  {gameConfig.name[locale as keyof typeof gameConfig.name] || gameConfig.name.de}
                </h1>
              </div>

              {/* Game Description/Info could go here in the future */}
              <p className="text-muted-foreground">
                {locale === "de"
                  ? "Rate 5 Orte so genau wie möglich. 30 Sekunden pro Ort."
                  : locale === "en"
                  ? "Guess 5 locations as accurately as possible. 30 seconds per location."
                  : "Ugani 5 lokacij čim bolj natančno. 30 sekund na lokacijo."}
              </p>
            </div>

            {/* Mobile-only Start Button Card */}
            <Card className="p-4 lg:hidden">
              <Button
                onClick={handleStartGame}
                disabled={creatingGame}
                size="lg"
                variant="primary"
                className="w-full"
              >
                {creatingGame
                  ? t("creating", { defaultValue: "Erstelle Spiel..." })
                  : locale === "de" ? "Spiel starten" : locale === "en" ? "Start Game" : "Začni igro"}
              </Button>
            </Card>
          </div>

          {/* Right Column: Rankings Card */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                {locale === "de" ? "Rangliste" : locale === "en" ? "Leaderboard" : "Lestvica"}
              </h3>

              {/* Weekly Top 5 */}
              <RankingsList
                players={weeklyTop5}
                title={locale === "de" ? "Diese Woche" : locale === "en" ? "This Week" : "Ta teden"}
              />

              {/* Alltime Top 5 (Best Score) */}
              <RankingsList
                players={alltimeTop5}
                title={locale === "de" ? "Bestes Spiel" : locale === "en" ? "Best Game" : "Najboljša igra"}
              />

              {/* Total Top 5 (Sum of all scores) */}
              <TotalRankingsList
                players={totalTop5}
                title={locale === "de" ? "Total" : locale === "en" ? "Total" : "Skupaj"}
              />

              {/* Divider */}
              <div className="border-t border-surface-3 my-4" />

              {/* User's Best Score */}
              {session?.user?.id && (
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {locale === "de" ? "Dein Bester" : locale === "en" ? "Your Best" : "Tvoj najboljši"}
                    </span>
                    <span className="text-lg font-bold text-primary tabular-nums">
                      {personalBest > 0 ? personalBest : "—"}
                    </span>
                  </div>
                </div>
              )}

              {/* Start Game Button - Desktop only */}
              <div className="hidden lg:block">
                <Button
                  onClick={handleStartGame}
                  disabled={creatingGame}
                  size="lg"
                  variant="primary"
                  className="w-full"
                >
                  {creatingGame
                    ? t("creating", { defaultValue: "Erstelle Spiel..." })
                    : locale === "de" ? "Spiel starten" : locale === "en" ? "Start Game" : "Začni igro"}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
