"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { LoginCard } from "@/components/auth/LoginCard";
import { useGameConfig, useRankings, useUserStats, useGuestId } from "./hooks";
import { StartButton, MyStats, RankingsList } from "./components";
import { CATEGORY_SLUGS } from "./constants";

export default function GuesserGameTypePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const gameType = decodeURIComponent(params.gameType as string);

  // Redirect category slugs to their proper routes
  useEffect(() => {
    if (CATEGORY_SLUGS.includes(gameType)) {
      router.replace(`/${locale}/guesser/${gameType}`);
    }
  }, [gameType, locale, router]);

  // Custom hooks
  const { gameConfig, loading: configLoading } = useGameConfig(gameType);
  const guestId = useGuestId();
  const {
    activeTab,
    currentPage,
    setCurrentPage,
    rankings,
    totalPages,
    loading: loadingRankings,
    userGameStats,
    handleTabChange,
  } = useRankings(gameType);
  const {
    gameTypeStats,
    loading: loadingStats,
  } = useUserStats(gameType);

  // Game creation state
  const [creatingGame, setCreatingGame] = useState(false);

  // Redirect if invalid game type (only after loading is complete)
  useEffect(() => {
    if (!configLoading && !gameConfig) {
      router.push(`/${locale}/guesser`);
    }
  }, [configLoading, gameConfig, router, locale]);

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
  if (configLoading || !gameConfig) {
    return null;
  }

  // Personal stats - use period-specific stats for weekly/best tabs, alltime for total tab
  const isGamesMode = activeTab === "weekly" || activeTab === "best";
  const personalGames = isGamesMode
    ? (userGameStats?.gamesCount || 0)
    : (gameTypeStats?.games || 0);
  const personalBest = isGamesMode
    ? (userGameStats?.bestScore || 0)
    : (gameTypeStats?.bestScore || 0);
  const personalTotalScore = isGamesMode
    ? (userGameStats?.totalScore || 0)
    : (gameTypeStats?.totalScore || 0);

  // Description labels
  const descriptions: Record<string, string> = {
    de: "Rate 5 Orte so genau wie möglich. 30 Sekunden pro Ort.",
    en: "Guess 5 locations as accurately as possible. 30 seconds per location.",
    sl: "Ugani 5 lokacij čim bolj natančno. 30 sekund na lokacijo.",
  };

  return (
    <div className="relative min-h-screen">
      {/* Background with world map */}
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
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Header Card - Full Width */}
        <Card className="p-6 mb-4">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-5xl">{gameConfig.icon}</span>
            <h1 className="text-3xl font-bold text-foreground">
              {gameConfig.name[locale as keyof typeof gameConfig.name] || gameConfig.name.de}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {descriptions[locale] || descriptions.de}
          </p>
        </Card>

        {/* Mobile Only: Play Button */}
        <Card className="p-4 mb-4 lg:hidden">
          <StartButton onClick={handleStartGame} disabled={creatingGame} locale={locale} />
        </Card>

        {/* Two Column Grid */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left: Leaderboard (3 cols) */}
          <div className="lg:col-span-3">
            <RankingsList
              locale={locale}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              rankings={rankings}
              loading={loadingRankings}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>

          {/* Right: My Rankings + Button (1 col) - Desktop Only */}
          <div className="hidden lg:block lg:col-span-1">
            {session?.user ? (
              <Card className="p-4">
                <MyStats
                  locale={locale}
                  loading={loadingStats}
                  personalGames={personalGames}
                  personalBest={personalBest}
                  personalTotalScore={personalTotalScore}
                />
                <StartButton onClick={handleStartGame} disabled={creatingGame} locale={locale} />
              </Card>
            ) : (
              <LoginCard />
            )}
          </div>
        </div>

        {/* Mobile Only: My Rankings at Bottom */}
        {session?.user && (
          <Card className="p-4 mt-4 lg:hidden">
            <MyStats
              locale={locale}
              loading={loadingStats}
              personalGames={personalGames}
              personalBest={personalBest}
              personalTotalScore={personalTotalScore}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
