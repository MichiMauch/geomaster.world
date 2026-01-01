"use client";

import { useEffect, useState } from "react";
import { GAME_TYPES, type GameTypeConfig } from "@/lib/game-types";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

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
  const [topPlayers, setTopPlayers] = useState<TopPlayersMap>({});
  const [loading, setLoading] = useState(true);

  // Filter and group game types
  const allGameTypes = Object.values(GAME_TYPES).filter((config) => {
    if (excludeImageTypes && config.type === "image") {
      return false;
    }
    return true;
  });

  const countryTypes = allGameTypes.filter((t) => t.type === "country");
  const worldTypes = allGameTypes.filter((t) => t.type === "world");

  // Fetch top 3 for each game type
  useEffect(() => {
    const fetchTopPlayers = async () => {
      setLoading(true);
      const results: TopPlayersMap = {};

      await Promise.all(
        allGameTypes.map(async (config) => {
          try {
            const res = await fetch(`/api/ranked/leaderboard?gameType=${config.id}&period=alltime&limit=3`);
            if (res.ok) {
              const data = await res.json();
              results[config.id] = data.rankings.map((r: any) => ({
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
  }, []);

  const getGameTypeName = (config: GameTypeConfig) => {
    const localeKey = locale as "de" | "en" | "sl";
    return config.name[localeKey] || config.name.en;
  };

  const handleClick = (gameTypeId: string) => {
    if (navigationMode) {
      router.push(`/${locale}${basePath}/${gameTypeId}`);
    } else if (onChange) {
      onChange(gameTypeId);
    }
  };

  const GameTypeCard = ({ config }: { config: GameTypeConfig }) => {
    const isSelected = selected === config.id;
    const name = getGameTypeName(config);
    const players = topPlayers[config.id] || [];

    return (
      <button
        onClick={() => handleClick(config.id)}
        className={cn(
          "flex flex-col p-4 rounded-sm border transition-all duration-200 text-left",
          "min-h-[160px]",
          isSelected
            ? "bg-primary/10 border-primary"
            : "bg-surface-1 border-surface-3",
          "hover:bg-surface-2 hover:border-primary/50",
          "active:scale-[0.98]"
        )}
      >
        {/* Header: Icon + Name */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{config.icon}</span>
          <span className={cn(
            "text-base font-semibold",
            isSelected ? "text-primary" : "text-foreground"
          )}>
            {name}
          </span>
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
                  <span>
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
      </button>
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
          <div className="grid grid-cols-2 gap-4">
            {worldTypes.map((config) => (
              <GameTypeCard key={config.id} config={config} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
