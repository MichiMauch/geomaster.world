"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { getGameTypeName, getGameTypesByType, GAME_TYPES } from "@/lib/game-types";
import { calculateScore } from "@/lib/score";

interface SoloGame {
  id: string;
  gameType: string | null;
  locationsPerRound: number;
  status: "active" | "completed";
  currentRound: number;
  createdAt: string;
  totalDistance?: number;
  roundsPlayed?: number;
  averageDistance?: number;
}

interface UserStatsItem {
  gameType: string;
  totalGames: number;
  totalRounds: number;
  totalDistance: number;
  totalScore: number;
  bestScore: number;
  averageDistance: number;
}

export default function SoloPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || "de";
  const { data: session, status } = useSession();
  const t = useTranslations("solo");
  const tCommon = useTranslations("common");
  const tGame = useTranslations("game");

  const [activeGame, setActiveGame] = useState<SoloGame | null>(null);
  const [completedGames, setCompletedGames] = useState<SoloGame[]>([]);
  const [userStats, setUserStats] = useState<UserStatsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Game creation settings
  const [showNewGame, setShowNewGame] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState("country:switzerland");
  const [locationsPerRound, setLocationsPerRound] = useState(5);
  const [totalRounds, setTotalRounds] = useState(1);

  const { country: countryGameTypes, world: worldGameTypes } = getGameTypesByType();
  const locationOptions = [3, 5, 10];
  const roundOptions = [1, 3, 5];

  useEffect(() => {
    if (status === "authenticated") {
      fetchSoloData();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  const fetchSoloData = async () => {
    try {
      const [gamesRes, statsRes] = await Promise.all([
        fetch(`/api/solo/games?locale=${locale}`),
        fetch("/api/user/stats"),
      ]);

      if (gamesRes.ok) {
        const gamesData = await gamesRes.json();
        setActiveGame(gamesData.activeGame || null);
        setCompletedGames(gamesData.completedGames || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setUserStats(statsData.stats || []);
      }
    } catch (err) {
      console.error("Error fetching solo data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGame = async () => {
    setCreating(true);
    try {
      const response = await fetch("/api/solo/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType: selectedGameType,
          locationsPerRound,
          totalRounds,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/${locale}/solo/${data.gameId}`);
      } else {
        const error = await response.json();
        alert(error.error || "Fehler beim Erstellen des Spiels");
      }
    } catch (err) {
      console.error("Error creating game:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleContinueGame = () => {
    if (activeGame) {
      router.push(`/${locale}/solo/${activeGame.id}`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-secondary">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (status === "unauthenticated") {
    return (
      <main className="max-w-xl mx-auto px-4 py-8">
        <Card variant="elevated" padding="xl" className="text-center">
          <h1 className="text-h2 text-text-primary mb-4">{t("title")}</h1>
          <p className="text-text-secondary mb-6">{t("loginRequired")}</p>
          <Button
            variant="primary"
            onClick={() => router.push(`/${locale}/login`)}
          >
            {tCommon("login")}
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-h1 text-text-primary">{t("title")}</h1>

      {/* Active Game Card */}
      {activeGame && (
        <Card variant="elevated" padding="lg" className="border-2 border-success/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-h3 text-success">{t("activeGame")}</h2>
              <p className="text-text-secondary">
                {getGameTypeName(activeGame.gameType || "country:switzerland", locale)} - {t("round")} {activeGame.currentRound}
              </p>
            </div>
            <Button variant="primary" onClick={handleContinueGame}>
              {t("continueGame")}
            </Button>
          </div>
        </Card>
      )}

      {/* New Game Section */}
      {!activeGame && (
        <Card variant="elevated" padding="lg">
          {!showNewGame ? (
            <div className="text-center">
              <h2 className="text-h3 text-text-primary mb-4">{t("startNewGame")}</h2>
              <Button variant="primary" size="lg" onClick={() => setShowNewGame(true)}>
                {t("newGame")}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-h3 text-text-primary text-center">{t("gameSettings")}</h2>

              {/* Game Type Selection */}
              <div className="space-y-3">
                <label className="block text-body-small font-medium text-text-primary text-center">
                  {tGame("selectGameType")}
                </label>

                {/* Country Game Types */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {countryGameTypes.map((gt) => (
                    <button
                      key={gt.id}
                      type="button"
                      onClick={() => setSelectedGameType(gt.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all text-sm",
                        selectedGameType === gt.id
                          ? "border-success bg-success/10 text-success"
                          : "border-glass-border bg-surface-2 text-text-secondary hover:border-success/50"
                      )}
                    >
                      <span>{gt.icon}</span>
                      <span>{gt.name[locale as keyof typeof gt.name] || gt.name.de}</span>
                    </button>
                  ))}
                </div>

                {/* World Game Types */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {worldGameTypes.map((gt) => (
                    <button
                      key={gt.id}
                      type="button"
                      onClick={() => setSelectedGameType(gt.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all text-sm",
                        selectedGameType === gt.id
                          ? "border-success bg-success/10 text-success"
                          : "border-glass-border bg-surface-2 text-text-secondary hover:border-success/50"
                      )}
                    >
                      <span>{gt.icon}</span>
                      <span>{gt.name[locale as keyof typeof gt.name] || gt.name.de}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Locations per Round */}
              <div className="space-y-2">
                <label className="block text-body-small font-medium text-text-primary text-center">
                  {tGame("locationsPerRound")}
                </label>
                <div className="flex gap-2 justify-center">
                  {locationOptions.map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setLocationsPerRound(count)}
                      className={cn(
                        "px-4 py-2 rounded-lg border-2 font-medium transition-all",
                        locationsPerRound === count
                          ? "border-success bg-success/10 text-success"
                          : "border-glass-border bg-surface-2 text-text-secondary hover:border-success/50"
                      )}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Rounds */}
              <div className="space-y-2">
                <label className="block text-body-small font-medium text-text-primary text-center">
                  {t("totalRounds")}
                </label>
                <div className="flex gap-2 justify-center">
                  {roundOptions.map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setTotalRounds(count)}
                      className={cn(
                        "px-4 py-2 rounded-lg border-2 font-medium transition-all",
                        totalRounds === count
                          ? "border-success bg-success/10 text-success"
                          : "border-glass-border bg-surface-2 text-text-secondary hover:border-success/50"
                      )}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <Button variant="ghost" onClick={() => setShowNewGame(false)}>
                  {tCommon("cancel")}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateGame}
                  disabled={creating}
                >
                  {creating ? tCommon("loading") : t("startGame")}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Stats Section */}
      {userStats.length > 0 && (
        <Card variant="surface" padding="lg">
          <h2 className="text-h3 text-text-primary mb-4">{t("yourStats")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {userStats.map((stat) => (
              <div key={stat.gameType} className="bg-surface-2 rounded-lg p-3 text-center">
                <p className="text-text-muted text-xs mb-1">
                  {getGameTypeName(stat.gameType, locale)}
                </p>
                <p className="text-h3 text-accent">{stat.totalGames}</p>
                <p className="text-text-secondary text-xs">{t("gamesPlayed")}</p>
                <p className="text-text-muted text-xs mt-1">
                  {t("bestScore")}: {stat.bestScore}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Completed Games */}
      {completedGames.length > 0 && (
        <Card variant="surface" padding="lg">
          <h2 className="text-h3 text-text-primary mb-4">{t("completedGames")}</h2>
          <div className="space-y-2">
            {completedGames.map((game) => (
              <div
                key={game.id}
                className="flex items-center justify-between bg-surface-2 rounded-lg px-4 py-3"
              >
                <div>
                  <p className="text-text-primary font-medium">
                    {getGameTypeName(game.gameType || "country:switzerland", locale)}
                  </p>
                  <p className="text-text-muted text-xs">
                    {new Date(game.createdAt).toLocaleDateString(locale)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-accent font-mono">
                    {game.totalDistance?.toFixed(1)} km
                  </p>
                  <p className="text-text-muted text-xs">
                    {game.roundsPlayed} {t("rounds")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Training Link */}
      <Card variant="glass" padding="md" className="text-center">
        <p className="text-text-secondary mb-2">{t("wantQuickPractice")}</p>
        <Button
          variant="ghost"
          onClick={() => router.push(`/${locale}/train`)}
        >
          {t("goToTraining")}
        </Button>
      </Card>
    </main>
  );
}
