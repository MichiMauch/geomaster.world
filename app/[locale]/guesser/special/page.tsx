"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { LoginCard } from "@/components/auth/LoginCard";
import { Play, Trophy, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { nanoid } from "nanoid";
import {
  worldQuizToGameTypeConfig,
  type DatabaseWorldQuizType,
} from "@/lib/utils/country-converter";
import type { GameTypeConfig } from "@/lib/game-types";

// Special quiz type IDs - these have unique gameplay mechanics
const SPECIAL_QUIZ_IDS = ["country-flags", "visual-middle", "place-names"];

interface TopPlayer {
  rank: number;
  userName: string | null;
  bestScore: number;
}

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

  const getGameTypeName = (config: GameTypeConfig) => {
    const localeKey = locale as "de" | "en" | "sl";
    return config.name[localeKey] || config.name.en;
  };

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

  const GameTypeCard = ({ config }: { config: GameTypeConfig }) => {
    const name = getGameTypeName(config);
    const players = topPlayers[config.id] || [];
    const isStarting = startingGame === config.id;

    return (
      <div className="flex flex-col p-4 rounded-lg border transition-all duration-200 bg-surface-1 border-surface-3 hover:border-primary/50 min-h-[160px]">
        {/* Header: Icon + Name + Action Buttons */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{config.icon}</span>
          <span className="text-base font-semibold flex-1 text-foreground">
            {name}
          </span>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleStartGame(config.id)}
              disabled={isStarting}
              title={locale === "de" ? "Spiel starten" : locale === "en" ? "Start game" : "Zacni igro"}
              className={cn(
                "p-2 rounded-sm transition-all cursor-pointer",
                "bg-primary/10 hover:bg-primary/20 text-primary",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isStarting ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => handleViewDetails(config.id)}
              title={locale === "de" ? "Rangliste" : locale === "en" ? "Leaderboard" : "Lestvica"}
              className={cn(
                "p-2 rounded-sm transition-all cursor-pointer",
                "bg-surface-2 hover:bg-surface-3 text-muted-foreground hover:text-foreground"
              )}
            >
              <Trophy className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top 3 Players */}
        <div className="flex-1">
          {loading ? (
            <div className="space-y-1.5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-surface-2 rounded-sm animate-pulse w-3/4" />
              ))}
            </div>
          ) : players.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {locale === "de" ? "Noch keine Spieler" : locale === "en" ? "No players yet" : "Se brez igralcev"}
            </p>
          ) : (
            <div className="space-y-1">
              {players.map((player, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <span className="w-4 text-center">
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`}
                  </span>
                  <span className="text-muted-foreground truncate flex-1">
                    {player.userName || "Anonym"}
                  </span>
                  <span className="text-foreground font-medium">
                    {player.bestScore}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
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
        {/* Back Button */}
        <button
          onClick={() => router.push(`/${locale}/guesser`)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>
            {locale === "de" ? "Zurück zur Übersicht" : locale === "en" ? "Back to overview" : "Nazaj na pregled"}
          </span>
        </button>

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
                  <GameTypeCard key={config.id} config={config} />
                ))}
              </div>
            )}
          </div>

          {/* Right: Login Card (1 col) */}
          <div className="lg:col-span-1">
            {session?.user ? (
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {(session.user.name || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {session.user.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {locale === "de" ? "Eingeloggt" : locale === "en" ? "Logged in" : "Prijavljen"}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {locale === "de" ? "Wähle ein Spezialquiz und starte dein Spiel!" :
                   locale === "en" ? "Choose a special quiz and start your game!" :
                   "Izberi poseben kviz in zacni svojo igro!"}
                </p>
              </Card>
            ) : (
              <LoginCard />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
