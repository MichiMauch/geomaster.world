"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { UserSidebar } from "@/components/guesser/UserSidebar";
import { Button } from "@/components/ui/Button";
import { Play, Trophy, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { nanoid } from "nanoid";
import { GAME_TYPES, type GameTypeConfig } from "@/lib/game-types";

interface TopPlayer {
  rank: number;
  userName: string | null;
  bestScore: number;
}

export default function PanoramaQuizPage() {
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingGame, setStartingGame] = useState(false);

  // Get the panorama:world config
  const panoramaConfig = GAME_TYPES["panorama:world"];

  // Fetch top 3 players
  useEffect(() => {
    const fetchTopPlayers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/ranked/leaderboard?gameType=panorama:world&mode=games&limit=3`);
        if (res.ok) {
          const data = await res.json();
          setTopPlayers(data.rankings.map((r: { rank: number; userName: string | null; bestScore: number }) => ({
            rank: r.rank,
            userName: r.userName,
            bestScore: r.bestScore
          })));
        }
      } catch (error) {
        console.error("Error fetching top players:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopPlayers();
  }, []);

  const getGameTypeName = () => {
    const localeKey = locale as "de" | "en" | "sl";
    return panoramaConfig.name[localeKey] || panoramaConfig.name.en;
  };

  // Navigate to leaderboard
  const handleViewLeaderboard = () => {
    router.push(`/${locale}/guesser/panorama:world`);
  };

  // Start game directly
  const handleStartGame = async () => {
    setStartingGame(true);
    try {
      const guestId = !session?.user ? nanoid() : undefined;
      const response = await fetch("/api/ranked/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameType: "panorama:world", guestId }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/${locale}/guesser/play/${data.gameId}`);
      } else {
        const error = await response.json();
        console.error("Failed to create game:", error);
        alert(error.error || "Failed to start game");
      }
    } catch (error) {
      console.error("Error starting game:", error);
    } finally {
      setStartingGame(false);
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
            <span className="text-4xl">📷</span>
            {locale === "de" ? "Street View" : locale === "en" ? "Street View" : "Ulični pogled"}
          </h1>
          <p className="text-muted-foreground">
            {locale === "de" ? "Erkunde die Welt in 360° und finde heraus, wo du bist - wie GeoGuessr!" :
             locale === "en" ? "Explore the world in 360° and find out where you are - like GeoGuessr!" :
             "Raziskuj svet v 360° in ugotovi, kje si - kot GeoGuessr!"}
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Game Card (3 cols) */}
          <div className="lg:col-span-3">
            <Card className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left: Game Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-orange-500/20 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-orange-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{getGameTypeName()}</h2>
                      <p className="text-sm text-muted-foreground">
                        {locale === "de" ? "5 Orte • 60 Sekunden pro Ort" :
                         locale === "en" ? "5 locations • 60 seconds per location" :
                         "5 lokacij • 60 sekund na lokacijo"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">🌍</span>
                      <p className="text-sm text-muted-foreground">
                        {locale === "de" ? "Schau dich um, bewege dich durch die Strassen und finde Hinweise" :
                         locale === "en" ? "Look around, navigate through streets and find clues" :
                         "Poglej naokoli, premikaj se po ulicah in poišči namige"}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-lg">📍</span>
                      <p className="text-sm text-muted-foreground">
                        {locale === "de" ? "Markiere deinen Tipp auf der Weltkarte" :
                         locale === "en" ? "Mark your guess on the world map" :
                         "Označi svoj poskus na svetovnem zemljevidu"}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-lg">⏱️</span>
                      <p className="text-sm text-muted-foreground">
                        {locale === "de" ? "Je schneller und näher, desto mehr Punkte!" :
                         locale === "en" ? "The faster and closer, the more points!" :
                         "Hitreje in bližje, več točk!"}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleStartGame}
                      disabled={startingGame}
                      className="flex-1"
                    >
                      {startingGame ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          {locale === "de" ? "Spiel starten" : locale === "en" ? "Start game" : "Začni igro"}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={handleViewLeaderboard}
                    >
                      <Trophy className="w-5 h-5 mr-2" />
                      {locale === "de" ? "Rangliste" : locale === "en" ? "Leaderboard" : "Lestvica"}
                    </Button>
                  </div>
                </div>

                {/* Right: Top Players */}
                <div className="md:w-64 p-4 bg-surface-2 rounded-lg">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    Top 3
                  </h3>
                  {loading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-6 bg-surface-3 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : topPlayers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {locale === "de" ? "Noch keine Spieler - sei der Erste!" :
                       locale === "en" ? "No players yet - be the first!" :
                       "Še ni igralcev - bodi prvi!"}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {topPlayers.map((player, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <span className="w-6 text-center">
                            {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
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
            </Card>
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
