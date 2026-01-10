"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { LoginCard } from "@/components/auth/LoginCard";
import { useGameConfig, useRankings, useGuestId, usePlayerRank } from "./hooks";
import { PodiumLeaderboard, StatsCard } from "./components";
import { CATEGORY_SLUGS } from "./constants";
import type { RankingEntry } from "./types";

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
  const { rankings, loading: loadingRankings } = useRankings(gameType);
  const { rankData, loading: loadingRank } = usePlayerRank(gameType);

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

  // Get highscore from rankings
  const highscore = rankings.length > 0 ? rankings[0].bestScore : 0;

  // Description labels with dynamic highscore
  const getDescription = () => {
    if (highscore > 0) {
      if (locale === "en") {
        return `The current highscore is ${highscore.toLocaleString()} points. Can you beat it?`;
      } else if (locale === "sl") {
        return `Trenutni najboljši rezultat je ${highscore.toLocaleString()} točk. Ga lahko premagaš?`;
      }
      return `Der aktuelle Highscore liegt bei ${highscore.toLocaleString()} Punkten. Kannst du ihn schlagen?`;
    }
    // Fallback if no highscore yet
    if (locale === "en") return "Be the first to set a highscore!";
    if (locale === "sl") return "Bodi prvi, ki postavi najboljši rezultat!";
    return "Sei der Erste, der einen Highscore aufstellt!";
  };

  const startLabels: Record<string, { creating: string; start: string }> = {
    de: { creating: "Erstelle Spiel...", start: "SPIEL STARTEN" },
    en: { creating: "Creating game...", start: "START GAME" },
    sl: { creating: "Ustvarjam igro...", start: "ZAČNI IGRO" },
  };

  const startLabel = startLabels[locale] || startLabels.de;
  const gameName = gameConfig.name[locale as keyof typeof gameConfig.name] || gameConfig.name.de;

  // Get top 10 rankings for the podium display
  const top10Rankings: RankingEntry[] = rankings.slice(0, 10);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image (Full Screen) */}
      <div className="absolute inset-0 -z-10">
        {gameConfig.backgroundImage ? (
          <Image
            src={gameConfig.backgroundImage}
            alt=""
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage: 'url("/images/hero-map-bg.jpg")',
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
        )}
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/75" />
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-4 min-h-screen">
        {/* 2-Spalten Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ZEILE 1, SPALTE 1: Landmark + Titel + Text */}
          <div className="order-1 lg:order-none animate-fade-in">
            <div className="flex items-center gap-4 mb-4">
              {/* Landmark Image */}
              {gameConfig.landmarkImage && (
                <div className="relative w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 flex-shrink-0">
                  <Image
                    src={gameConfig.landmarkImage}
                    alt={gameName}
                    fill
                    className="object-contain drop-shadow-[0_0_20px_rgba(0,217,255,0.4)]"
                    priority
                  />
                </div>
              )}
              {/* Titel */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground font-heading tracking-tight">
                {gameName}
              </h1>
            </div>
            {/* Highscore Text */}
            <p className="text-base text-text-secondary">
              {getDescription()}
            </p>
          </div>

          {/* ZEILE 1, SPALTE 2: Nur Podium */}
          <div className="order-3 lg:order-none animate-fade-in flex items-end justify-center" style={{ animationDelay: "100ms" }}>
            <PodiumLeaderboard
              rankings={top10Rankings}
              loading={loadingRankings}
              locale={locale}
              showPodium={true}
              showList={false}
            />
          </div>

          {/* ZEILE 2, SPALTE 1: Stats + Button */}
          <div className="order-2 lg:order-none flex flex-col gap-4">
            {/* Stats Card */}
            <div className="animate-fade-in" style={{ animationDelay: "150ms" }}>
              {session?.user ? (
                <StatsCard
                  locale={locale}
                  loading={loadingRank}
                  personalBest={rankData?.bestScore || 0}
                  personalTotalScore={rankData?.totalScore || 0}
                  topPercentage={rankData?.topPercentage || null}
                  userRank={rankData?.rank || null}
                  totalPlayers={rankData?.totalPlayers || 0}
                />
              ) : (
                <LoginCard />
              )}
            </div>

            {/* Start Button */}
            <div className="animate-fade-in" style={{ animationDelay: "200ms" }}>
              <Button
                onClick={handleStartGame}
                disabled={creatingGame}
                size="xl"
                variant="primary"
                className="w-full text-xl font-bold tracking-wider py-5 shadow-[0_0_40px_rgba(0,217,255,0.6)] hover:shadow-[0_0_60px_rgba(0,217,255,0.8)] transition-all"
              >
                {creatingGame ? startLabel.creating : startLabel.start}
              </Button>
            </div>
          </div>

          {/* ZEILE 2, SPALTE 2: Nur Liste 4-10 + Link */}
          <div className="order-4 lg:order-none animate-fade-in" style={{ animationDelay: "150ms" }}>
            <PodiumLeaderboard
              rankings={top10Rankings}
              loading={loadingRankings}
              locale={locale}
              gameType={gameType}
              showPodium={false}
              showList={true}
              showLeaderboardLink={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
