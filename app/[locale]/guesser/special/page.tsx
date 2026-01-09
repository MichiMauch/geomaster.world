"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { UserSidebar } from "@/components/guesser/UserSidebar";
import { GameTypeCard, type TopPlayer } from "@/components/guesser/GameTypeCard";
import { nanoid } from "nanoid";
import {
  worldQuizToGameTypeConfig,
  type DatabaseWorldQuizType,
} from "@/lib/utils/country-converter";
import type { GameTypeConfig } from "@/lib/game-types";

// Special quiz type IDs - these have unique gameplay mechanics
const SPECIAL_QUIZ_IDS = ["country-flags", "visual-middle", "place-names"];

// Special quiz images mapping (quiz ID -> image path)
const SPECIAL_IMAGES: Record<string, string> = {
  "world:country-flags": "/images/flags.webp",
  "world:visual-middle": "/images/middle.webp",
  "world:place-names": "/images/specialnames.webp",
};

interface TopPlayersMap {
  [gameType: string]: TopPlayer[];
}

export default function SpecialQuizPage() {
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const [topPlayers, setTopPlayers] = useState<TopPlayersMap>({});
  const [loading, setLoading] = useState(true);
  const [startingGame, setStartingGame] = useState<string | null>(null);
  const [quizTypesLoading, setQuizTypesLoading] = useState(true);
  const [specialTypes, setSpecialTypes] = useState<GameTypeConfig[]>([]);

  // Fetch special quiz types from database
  useEffect(() => {
    const fetchSpecialQuizTypes = async () => {
      try {
        const res = await fetch("/api/world-quiz-types?active=true");
        if (res.ok) {
          const data: DatabaseWorldQuizType[] = await res.json();
          // Filter only special quiz types
          const specialQuizTypes = data.filter((w) => SPECIAL_QUIZ_IDS.includes(w.id));
          const specialConfigs = specialQuizTypes.map(worldQuizToGameTypeConfig);
          setSpecialTypes(specialConfigs);
        }
      } catch (error) {
        console.error("Error fetching special quiz types:", error);
      } finally {
        setQuizTypesLoading(false);
      }
    };
    fetchSpecialQuizTypes();
  }, []);

  // Fetch top 3 for each game type
  useEffect(() => {
    if (quizTypesLoading || specialTypes.length === 0) return;

    const fetchTopPlayers = async () => {
      setLoading(true);
      const results: TopPlayersMap = {};

      await Promise.all(
        specialTypes.map(async (config) => {
          try {
            const res = await fetch(`/api/ranked/leaderboard?gameType=${config.id}&mode=games&limit=3`);
            if (res.ok) {
              const data = await res.json();
              results[config.id] = data.rankings.map((r: { rank: number; userName: string | null; bestScore: number }) => ({
                rank: r.rank,
                userName: r.userName,
                bestScore: r.bestScore
              }));
            }
          } catch (error) {
            console.error(`Error fetching top players for ${config.id}:`, error);
          }
        })
      );

      setTopPlayers(results);
      setLoading(false);
    };

    fetchTopPlayers();
  }, [quizTypesLoading, specialTypes]);

  // Navigate to detail page (leaderboard)
  const handleViewDetails = (gameTypeId: string) => {
    router.push(`/${locale}/guesser/${gameTypeId}`);
  };

  // Start game directly
  const handleStartGame = async (gameTypeId: string) => {
    setStartingGame(gameTypeId);
    try {
      const guestId = !session?.user ? nanoid() : undefined;
      const response = await fetch("/api/ranked/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameType: gameTypeId, guestId }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/${locale}/guesser/play/${data.gameId}`);
      } else {
        const error = await response.json();
        console.error("Failed to create game:", error);
      }
    } catch (error) {
      console.error("Error starting game:", error);
    } finally {
      setStartingGame(null);
    }
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

      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
            <span className="text-4xl">✨</span>
            {locale === "de" ? "Spezialquizes" : locale === "en" ? "Special Quizzes" : "Posebni kvizi"}
          </h1>
          <p className="text-muted-foreground">
            {locale === "de" ? "Flaggen, Ländernamen, geografische Mittelpunkte und mehr" :
             locale === "en" ? "Flags, country names, geographic centers and more" :
             "Zastave, imena drzav, geografski centri in vec"}
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Game Types Grid (3 cols) */}
          <div className="lg:col-span-3">
            {quizTypesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-40 bg-surface-1 border border-surface-3 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : specialTypes.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  {locale === "de" ? "Keine Spezialquizes verfügbar" : locale === "en" ? "No special quizzes available" : "Ni na voljo nobenih posebnih kvizov"}
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {specialTypes.map((config) => (
                  <GameTypeCard
                    key={config.id}
                    config={config}
                    locale={locale}
                    topPlayers={topPlayers[config.id] || []}
                    loading={loading}
                    isStarting={startingGame === config.id}
                    onStartGame={handleStartGame}
                    onViewDetails={handleViewDetails}
                    variant="overlay"
                    backgroundImage={SPECIAL_IMAGES[config.id]}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: User Stats or Login (1 col) */}
          <div className="lg:col-span-1">
            <UserSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
