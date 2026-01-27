"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { LoginCard } from "@/components/auth/LoginCard";
import {
  useGameConfig,
  useRankings,
  useGuestId,
  usePlayerRank,
  useDuelRankings,
  useDuelPlayerStats,
} from "./hooks";
import {
  PodiumLeaderboard,
  StatsCard,
  ModeToggle,
  DuelStatsCard,
} from "./components";
import type { GameMode } from "./components";
import { CATEGORY_SLUGS } from "./constants";
import type { RankingEntry } from "./types";
import { cn } from "@/lib/utils";

const labels: Record<string, {
  creating: string;
  startSolo: string;
  startDuel: string;
  loginForDuel: string;
}> = {
  de: {
    creating: "Erstelle Spiel...",
    startSolo: "SPIEL STARTEN",
    startDuel: "FREUND HERAUSFORDERN",
    loginForDuel: "Anmelden für Duell",
  },
  en: {
    creating: "Creating game...",
    startSolo: "START GAME",
    startDuel: "CHALLENGE FRIEND",
    loginForDuel: "Login for Duel",
  },
  sl: {
    creating: "Ustvarjam igro...",
    startSolo: "ZAČNI IGRO",
    startDuel: "IZZOVI PRIJATELJA",
    loginForDuel: "Prijava za dvoboj",
  },
};

export default function GuesserGameTypePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const gameType = decodeURIComponent(params.gameType as string);

  // Mode state
  const [mode, setMode] = useState<GameMode>("solo");
  const [creatingGame, setCreatingGame] = useState(false);

  const isDuel = mode === "duel";
  const isLoggedIn = !!session?.user?.id;
  const t = labels[locale] || labels.de;

  // Redirect category slugs to their proper routes
  useEffect(() => {
    if (CATEGORY_SLUGS.includes(gameType)) {
      router.replace(`/${locale}/guesser/${gameType}`);
    }
  }, [gameType, locale, router]);

  // Custom hooks
  const { gameConfig, loading: configLoading } = useGameConfig(gameType);
  useGuestId(); // Keep generating guestId for non-logged-in users

  // Solo hooks
  const { rankings: soloRankings, loading: loadingSoloRankings } = useRankings(gameType);
  const { rankData, loading: loadingRank } = usePlayerRank(gameType);

  // Duel hooks (only fetch when in duel mode)
  const { rankings: duelRankings, loading: loadingDuelRankings } = useDuelRankings(gameType, isDuel);
  const { duelStats, loading: loadingDuelStats } = useDuelPlayerStats(gameType, isDuel && isLoggedIn);

  // Redirect if invalid game type (only after loading is complete)
  useEffect(() => {
    if (!configLoading && !gameConfig) {
      router.push(`/${locale}/guesser`);
    }
  }, [configLoading, gameConfig, router, locale]);

  const handleStartGame = async () => {
    setCreatingGame(true);
    try {
      if (isDuel) {
        // Start duel game directly
        if (!session?.user?.id) {
          setCreatingGame(false);
          return;
        }
        const response = await fetch("/api/ranked/games/duel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameType }),
        });

        if (response.ok) {
          const data = await response.json();
          router.push(`/${locale}/guesser/play/${data.gameId}`);
        } else {
          const error = await response.json();
          alert(error.error || "Failed to create duel");
          setCreatingGame(false);
        }
      } else {
        // Start normal game
        const guestId = localStorage.getItem("guestId");
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
          setCreatingGame(false);
        }
      }
    } catch (error) {
      console.error("Error creating game:", error);
      alert("Failed to create game");
      setCreatingGame(false);
    }
  };

  // Show loading or nothing while validating/redirecting
  if (configLoading || !gameConfig) {
    return null;
  }

  const gameName = gameConfig.name[locale as keyof typeof gameConfig.name] || gameConfig.name.de;
  const gameDescription = gameConfig.description?.[locale as keyof typeof gameConfig.description] || gameConfig.description?.de;

  // Get top 10 rankings for the podium display
  const top10Rankings: RankingEntry[] = soloRankings.slice(0, 10);
  const top10DuelRankings = duelRankings.slice(0, 10);

  return (
    <div className={cn(
      "relative min-h-screen overflow-hidden transition-colors duration-300",
      isDuel && "duel-mode"
    )}>
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

          {/* ZEILE 1, SPALTE 1: Landmark + Titel + Mode Toggle */}
          <div className="order-1 lg:order-none animate-fade-in">
            <div className="flex items-center gap-4 mb-4">
              {/* Landmark Image with mode-dependent border */}
              {gameConfig.landmarkImage && (
                <div className={cn(
                  "relative w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 flex-shrink-0 rounded-xl transition-all duration-300",
                  isDuel
                    ? "ring-4 ring-accent/50 shadow-[0_0_30px_rgba(255,107,53,0.3)]"
                    : "drop-shadow-[0_0_20px_rgba(0,217,255,0.4)]"
                )}>
                  <Image
                    src={gameConfig.landmarkImage}
                    alt={gameName}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              )}
              {/* Titel */}
              <h1 className={cn(
                "text-3xl md:text-4xl lg:text-5xl font-bold font-heading tracking-tight transition-colors duration-300",
                isDuel ? "text-accent" : "text-foreground"
              )}>
                {gameName}
              </h1>
            </div>
            {gameDescription && (
              <p className="text-sm text-muted-foreground mb-2">{gameDescription}</p>
            )}
            {/* Mode Toggle - full width under title */}
            <ModeToggle
              mode={mode}
              onModeChange={setMode}
              locale={locale}
              isLoggedIn={isLoggedIn}
              disabled={creatingGame}
            />
          </div>

          {/* ZEILE 1, SPALTE 2: Podium */}
          <div className="order-3 lg:order-none animate-fade-in flex items-end justify-center" style={{ animationDelay: "100ms" }}>
            <PodiumLeaderboard
              rankings={isDuel ? top10DuelRankings : top10Rankings}
              loading={isDuel ? loadingDuelRankings : loadingSoloRankings}
              locale={locale}
              showPodium={true}
              showList={false}
              variant={mode}
            />
          </div>

          {/* ZEILE 2, SPALTE 1: Stats + Button */}
          <div className="order-2 lg:order-none flex flex-col gap-4">
            {/* Stats Card */}
            <div className="animate-fade-in" style={{ animationDelay: "150ms" }}>
              {isDuel ? (
                isLoggedIn ? (
                  <DuelStatsCard
                    locale={locale}
                    loading={loadingDuelStats}
                    wins={duelStats?.wins || 0}
                    losses={duelStats?.losses || 0}
                    winRate={duelStats?.winRate || 0}
                    totalDuels={duelStats?.totalDuels || 0}
                    rank={duelStats?.rank || null}
                    duelPoints={duelStats?.duelPoints || 0}
                  />
                ) : (
                  <LoginCard />
                )
              ) : (
                session?.user ? (
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
                )
              )}
            </div>

            {/* Start Button */}
            <div className="animate-fade-in" style={{ animationDelay: "200ms" }}>
              {isDuel && !isLoggedIn ? (
                <Button
                  onClick={() => {/* handled by LoginCard */}}
                  size="xl"
                  variant="outline"
                  className="w-full text-xl font-bold tracking-wider py-5 opacity-50 cursor-not-allowed"
                  disabled
                >
                  {t.loginForDuel}
                </Button>
              ) : (
                <Button
                  onClick={handleStartGame}
                  size="xl"
                  variant={isDuel ? "accent" : "primary"}
                  className={cn(
                    "w-full text-xl font-bold tracking-wider py-5 transition-all",
                    isDuel
                      ? "shadow-[0_0_40px_rgba(255,107,53,0.6)] hover:shadow-[0_0_60px_rgba(255,107,53,0.8)]"
                      : "shadow-[0_0_40px_rgba(0,217,255,0.6)] hover:shadow-[0_0_60px_rgba(0,217,255,0.8)]"
                  )}
                  disabled={creatingGame}
                  isLoading={creatingGame}
                >
                  {creatingGame ? t.creating : (isDuel ? t.startDuel : t.startSolo)}
                </Button>
              )}
            </div>
          </div>

          {/* ZEILE 2, SPALTE 2: Liste 4-10 + Link */}
          <div className="order-4 lg:order-none animate-fade-in" style={{ animationDelay: "150ms" }}>
            <PodiumLeaderboard
              rankings={isDuel ? top10DuelRankings : top10Rankings}
              loading={isDuel ? loadingDuelRankings : loadingSoloRankings}
              locale={locale}
              gameType={gameType}
              showPodium={false}
              showList={true}
              showLeaderboardLink={true}
              variant={mode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
