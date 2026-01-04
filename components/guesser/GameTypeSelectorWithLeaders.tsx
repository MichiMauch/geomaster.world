"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { GAME_TYPES, type GameTypeConfig } from "@/lib/game-types";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Play, Trophy } from "lucide-react";
import { nanoid } from "nanoid";
import {
  countriesToGameTypeConfigs,
  getActiveCountries,
  worldQuizToGameTypeConfig,
  type DatabaseCountry,
  type DatabaseWorldQuizType,
} from "@/lib/utils/country-converter";

interface GameTypeSelectorWithLeadersProps {
  selected?: string | null;
  onChange?: (gameType: string) => void;
  excludeImageTypes?: boolean;
  navigationMode?: boolean;
  basePath?: string;
}

interface TopPlayer {
  rank: number;
  userName: string | null;
  bestScore: number;
}

interface TopPlayersMap {
  [gameType: string]: TopPlayer[];
}

export default function GameTypeSelectorWithLeaders({
  selected,
  onChange,
  excludeImageTypes = true,
  navigationMode = false,
  basePath = "/guesser"
}: GameTypeSelectorWithLeadersProps) {
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const [topPlayers, setTopPlayers] = useState<TopPlayersMap>({});
  const [loading, setLoading] = useState(true);
  const [startingGame, setStartingGame] = useState<string | null>(null);
  const [dbCountries, setDbCountries] = useState<DatabaseCountry[]>([]);
  const [dbWorldQuizTypes, setDbWorldQuizTypes] = useState<DatabaseWorldQuizType[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [worldQuizTypesLoading, setWorldQuizTypesLoading] = useState(true);

  // Fetch active countries from database
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch("/api/countries?active=true");
        if (res.ok) {
          const data = await res.json();
          setDbCountries(data);
        }
      } catch (error) {
        console.error("Error fetching countries:", error);
      } finally {
        setCountriesLoading(false);
      }
    };
    fetchCountries();
  }, []);

  // Fetch active world quiz types from database
  useEffect(() => {
    const fetchWorldQuizTypes = async () => {
      try {
        const res = await fetch("/api/world-quiz-types?active=true");
        if (res.ok) {
          const data = await res.json();
          setDbWorldQuizTypes(data);
        }
      } catch (error) {
        console.error("Error fetching world quiz types:", error);
      } finally {
        setWorldQuizTypesLoading(false);
      }
    };
    fetchWorldQuizTypes();
  }, []);

  // Convert DB countries and world quiz types to GameTypeConfig
  const { countryTypes, worldTypes, allGameTypes } = useMemo(() => {
    // Get country types from database
    const activeCountries = getActiveCountries(dbCountries);
    const countryConfigs = countriesToGameTypeConfigs(activeCountries);

    // Get world quiz types from database
    const activeWorldQuizTypes = dbWorldQuizTypes.filter(w => w.isActive);
    const worldConfigs = activeWorldQuizTypes.map(worldQuizToGameTypeConfig);

    // Optionally include image types from static GAME_TYPES
    const imageTypes = excludeImageTypes
      ? []
      : Object.values(GAME_TYPES).filter((config) => config.type === "image");

    const all = [...countryConfigs, ...worldConfigs, ...imageTypes];

    return {
      countryTypes: countryConfigs,
      worldTypes: worldConfigs,
      allGameTypes: all,
    };
  }, [dbCountries, dbWorldQuizTypes, excludeImageTypes]);

  // Fetch top 3 for each game type (wait for data to load first)
  useEffect(() => {
    if (countriesLoading || worldQuizTypesLoading || allGameTypes.length === 0) return;

    const fetchTopPlayers = async () => {
      setLoading(true);
      const results: TopPlayersMap = {};

      await Promise.all(
        allGameTypes.map(async (config) => {
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
  }, [countriesLoading, worldQuizTypesLoading, allGameTypes]);

  const getGameTypeName = (config: GameTypeConfig) => {
    const localeKey = locale as "de" | "en" | "sl";
    return config.name[localeKey] || config.name.en;
  };

  // Navigate to detail page (leaderboard)
  const handleViewDetails = (gameTypeId: string) => {
    if (navigationMode) {
      router.push(`/${locale}${basePath}/${gameTypeId}`);
    } else if (onChange) {
      onChange(gameTypeId);
    }
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
    const isSelected = selected === config.id;
    const name = getGameTypeName(config);
    const players = topPlayers[config.id] || [];
    const isStarting = startingGame === config.id;

    return (
      <div
        className={cn(
          "flex flex-col p-4 rounded-sm border transition-all duration-200",
          "min-h-[160px]",
          isSelected
            ? "bg-primary/10 border-primary"
            : "bg-surface-1 border-surface-3"
        )}
      >
        {/* Header: Icon + Name + Action Buttons */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{config.icon}</span>
          <span className={cn(
            "text-base font-semibold flex-1",
            isSelected ? "text-primary" : "text-foreground"
          )}>
            {name}
          </span>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleStartGame(config.id)}
              disabled={isStarting}
              title={locale === "de" ? "Spiel starten" : locale === "en" ? "Start game" : "Začni igro"}
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
              {locale === "de" ? "Noch keine Spieler" : locale === "en" ? "No players yet" : "Še brez igralcev"}
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column: Countries */}
      {countryTypes.length > 0 && (
        <div className="bg-surface-1 border border-surface-3 rounded-sm p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
            {locale === "de" ? "Länder" : locale === "en" ? "Countries" : "Države"}
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {countryTypes.map((config) => (
              <GameTypeCard key={config.id} config={config} />
            ))}
          </div>
        </div>
      )}

      {/* Right Column: World Quiz */}
      {worldTypes.length > 0 && (
        <div className="bg-surface-1 border border-surface-3 rounded-sm p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
            {locale === "de" ? "Welt-Quiz" : locale === "en" ? "World Quiz" : "Svetovni kviz"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {worldTypes.map((config) => (
              <GameTypeCard key={config.id} config={config} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
