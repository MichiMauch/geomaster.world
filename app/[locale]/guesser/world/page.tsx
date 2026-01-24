"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { UserSidebar } from "@/components/guesser/UserSidebar";
import { GameTypeCard, type TopPlayer } from "@/components/guesser/GameTypeCard";
import {
  worldQuizToGameTypeConfig,
  type DatabaseWorldQuizType,
} from "@/lib/utils/country-converter";
import type { GameTypeConfig } from "@/lib/game-types";
import MissionControlBackground from "@/components/MissionControlBackground";

// Special quiz type IDs - these are shown in the special category, not here
const SPECIAL_QUIZ_IDS = ["country-flags", "visual-middle", "place-names", "emoji-countries", "james-bond-007"];

// World quiz images mapping (quiz ID -> image path)
const WORLD_QUIZ_IMAGES: Record<string, string> = {
  "famous-places": "/images/famouse.webp",
  "formula-1": "/images/formula1.webp",
  "capitals": "/images/capitals.webp",
  "highest-mountains": "/images/mountains.webp",
  "airports": "/images/airport.webp",
  "unesco": "/images/unesco.webp",
};

interface TopPlayersMap {
  [gameType: string]: TopPlayer[];
}

export default function WorldQuizPage() {
  const locale = useLocale();
  const router = useRouter();
  const [topPlayers, setTopPlayers] = useState<TopPlayersMap>({});
  const [loading, setLoading] = useState(true);
  const [worldQuizTypesLoading, setWorldQuizTypesLoading] = useState(true);
  const [worldTypes, setWorldTypes] = useState<GameTypeConfig[]>([]);

  // Fetch active world quiz types from database
  useEffect(() => {
    const fetchWorldQuizTypes = async () => {
      try {
        const res = await fetch("/api/world-quiz-types?active=true");
        if (res.ok) {
          const data = await res.json();
          // Filter out special quiz types - they have their own category
          const activeWorldQuizTypes = data.filter(
            (w: DatabaseWorldQuizType) => w.isActive && !SPECIAL_QUIZ_IDS.includes(w.id)
          );
          const worldConfigs = activeWorldQuizTypes.map(worldQuizToGameTypeConfig);
          setWorldTypes(worldConfigs);
        }
      } catch (error) {
        console.error("Error fetching world quiz types:", error);
      } finally {
        setWorldQuizTypesLoading(false);
      }
    };
    fetchWorldQuizTypes();
  }, []);

  // Fetch top 3 for each game type
  useEffect(() => {
    if (worldQuizTypesLoading || worldTypes.length === 0) return;

    const fetchTopPlayers = async () => {
      setLoading(true);
      const results: TopPlayersMap = {};

      await Promise.all(
        worldTypes.map(async (config) => {
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
  }, [worldQuizTypesLoading, worldTypes]);

  // Navigate to detail page
  const handleViewDetails = (gameTypeId: string) => {
    router.push(`/${locale}/guesser/${gameTypeId}`);
  };

  // Helper to get background image for a world quiz config
  const getWorldQuizImage = (configId: string) => {
    const worldQuizId = configId.replace("world:", "");
    return WORLD_QUIZ_IMAGES[worldQuizId];
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
        <MissionControlBackground />
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
            <span className="text-4xl">🌐</span>
            {locale === "de" ? "Welt-Quiz" : locale === "en" ? "World Quiz" : "Svetovni kviz"}
          </h1>
          <p className="text-muted-foreground">
            {locale === "de" ? "Entdecke berühmte Orte, Rennstrecken und mehr auf der ganzen Welt" :
             locale === "en" ? "Discover famous places, race tracks and more around the world" :
             "Odkrij znamenite kraje, dirkalisca in vec po vsem svetu"}
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Game Types Grid (3 cols) */}
          <div className="lg:col-span-3">
            {worldQuizTypesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-40 bg-surface-1 border border-surface-3 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : worldTypes.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  {locale === "de" ? "Keine Welt-Quizes verfügbar" : locale === "en" ? "No world quizzes available" : "Ni na voljo nobenih svetovnih kvizov"}
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {worldTypes.map((config) => (
                  <GameTypeCard
                    key={config.id}
                    config={config}
                    locale={locale}
                    topPlayers={topPlayers[config.id] || []}
                    loading={loading}
                    onViewDetails={handleViewDetails}
                    variant="overlay"
                    backgroundImage={getWorldQuizImage(config.id)}
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
