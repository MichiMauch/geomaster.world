"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getGameTypeConfig } from "@/lib/game-types";
import RankingsTable from "@/components/guesser/RankingsTable";
import PeriodSelector from "@/components/guesser/PeriodSelector";
import { ArrowLeft } from "lucide-react";
import { nanoid } from "nanoid";
import type { RankingPeriod } from "@/lib/services/ranking-service";

export default function GuesserGameTypePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const gameType = decodeURIComponent(params.gameType as string);
  const t = useTranslations("ranked");

  // Validate game type
  const gameConfig = getGameTypeConfig(gameType);

  const [selectedPeriod, setSelectedPeriod] = useState<RankingPeriod>("alltime");
  const [rankings, setRankings] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
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
  const personalGames = userStats?.gameTypeBreakdown?.[gameType]?.games || 0;

  // Global best score (rank 1 from rankings)
  const globalBest = rankings[0] || null;

  // Fetch rankings when period or gameType changes
  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/ranked/leaderboard?gameType=${gameType}&period=${selectedPeriod}`
        );
        if (response.ok) {
          const data = await response.json();
          setRankings(data.rankings || []);
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
  }, [gameType, selectedPeriod]);

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

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.push(`/${locale}/guesser`)}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("backToHub", { defaultValue: "Zurück zur Übersicht" })}
      </button>

      {/* Header: Game Type Name + Icon */}
      <div className="mb-8 flex items-center gap-4">
        <span className="text-6xl">{gameConfig.icon}</span>
        <div>
          <h1 className="text-4xl font-bold text-foreground">
            {gameConfig.name[locale as keyof typeof gameConfig.name] || gameConfig.name.de}
          </h1>
          <p className="text-muted-foreground">Guesser Mode</p>
        </div>
      </div>

      {/* Records Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Personal Best */}
        {session?.user?.id && (
          <Card className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              {t("yourRecord", { defaultValue: "Dein Rekord" })}
            </h3>
            <div className="text-3xl font-bold text-primary">
              {personalBest > 0 ? `${personalBest} Punkte` : "-"}
            </div>
            {personalGames > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {personalGames} {t("gamesPlayed", { defaultValue: "Spiele gespielt" })}
              </p>
            )}
          </Card>
        )}

        {/* Global Best */}
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            {t("worldRecord", { defaultValue: "Weltrekord" })}
          </h3>
          {globalBest ? (
            <>
              <div className="text-3xl font-bold text-primary">
                {globalBest.bestScore} Punkte
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t("by", { defaultValue: "von" })} {globalBest.userName || "Anonym"}
              </p>
            </>
          ) : (
            <div className="text-3xl font-bold text-muted-foreground">-</div>
          )}
        </Card>
      </div>

      {/* Leaderboard Section */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold">
            {t("rankings", { defaultValue: "Rankings" })}
          </h3>
          <div className="flex items-center gap-4">
            <PeriodSelector selected={selectedPeriod} onChange={setSelectedPeriod} />
            <Button
              onClick={handleStartGame}
              disabled={creatingGame}
              size="lg"
            >
              {creatingGame
                ? t("creating", { defaultValue: "Erstelle Spiel..." })
                : t("startGame", { defaultValue: "Spiel starten" })}
            </Button>
          </div>
        </div>

        <RankingsTable
          rankings={rankings}
          highlightUserId={session?.user?.id}
          loading={loading}
        />
      </Card>
    </div>
  );
}
