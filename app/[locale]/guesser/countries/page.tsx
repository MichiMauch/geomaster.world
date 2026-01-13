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
  countriesToGameTypeConfigs,
  getActiveCountries,
  type DatabaseCountry,
} from "@/lib/utils/country-converter";
import type { GameTypeConfig } from "@/lib/game-types";
import MissionControlBackground from "@/components/MissionControlBackground";

interface TopPlayersMap {
  [gameType: string]: TopPlayer[];
}

export default function CountriesPage() {
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const [topPlayers, setTopPlayers] = useState<TopPlayersMap>({});
  const [loading, setLoading] = useState(true);
  const [startingGame, setStartingGame] = useState<string | null>(null);
  const [dbCountries, setDbCountries] = useState<DatabaseCountry[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countryTypes, setCountryTypes] = useState<GameTypeConfig[]>([]);

  // Fetch active countries from database
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch("/api/countries?active=true");
        if (res.ok) {
          const data = await res.json();
          setDbCountries(data);
          const activeCountries = getActiveCountries(data);
          const countryConfigs = countriesToGameTypeConfigs(activeCountries);
          setCountryTypes(countryConfigs);
        }
      } catch (error) {
        console.error("Error fetching countries:", error);
      } finally {
        setCountriesLoading(false);
      }
    };
    fetchCountries();
  }, []);

  // Fetch top 3 for each game type
  useEffect(() => {
    if (countriesLoading || countryTypes.length === 0) return;

    const fetchTopPlayers = async () => {
      setLoading(true);
      const results: TopPlayersMap = {};

      await Promise.all(
        countryTypes.map(async (config) => {
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
  }, [countriesLoading, countryTypes]);

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

  // Helper to get image/flag for a country config from DB data
  const getCountryAssets = (configId: string) => {
    const countryId = configId.replace("country:", "");
    const country = dbCountries.find((c) => c.id === countryId);
    return {
      backgroundImage: country?.cardImage || undefined,
      flagImage: country?.flagImage || undefined,
    };
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
            <span className="text-4xl">🌍</span>
            {locale === "de" ? "Länderquiz" : locale === "en" ? "Country Quiz" : "Kviz drzav"}
          </h1>
          <p className="text-muted-foreground">
            {locale === "de" ? "Teste dein Wissen über verschiedene Länder und ihre Geografie" :
             locale === "en" ? "Test your knowledge about different countries and their geography" :
             "Preizkusi svoje znanje o razlicnih drzavah in njihovi geografiji"}
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Game Types Grid (3 cols) */}
          <div className="lg:col-span-3">
            {countriesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-40 bg-surface-1 border border-surface-3 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : countryTypes.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  {locale === "de" ? "Keine Länderquizes verfügbar" : locale === "en" ? "No country quizzes available" : "Ni na voljo nobenih kvizov drzav"}
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {countryTypes.map((config) => {
                  const { backgroundImage, flagImage } = getCountryAssets(config.id);
                  return (
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
                      backgroundImage={backgroundImage}
                      flagImage={flagImage}
                    />
                  );
                })}
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
