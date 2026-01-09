"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";
import { useGameTypes } from "./hooks";
import { GameTypeCard } from "./GameTypeCard";
import type { GameTypeSelectorWithLeadersProps } from "./types";

const categoryLabels: Record<string, { countries: string; worldQuiz: string }> = {
  de: { countries: "Länder", worldQuiz: "Welt-Quiz" },
  en: { countries: "Countries", worldQuiz: "World Quiz" },
  sl: { countries: "Države", worldQuiz: "Svetovni kviz" },
};

export default function GameTypeSelectorWithLeaders({
  selected,
  onChange,
  excludeImageTypes = true,
  navigationMode = false,
  basePath = "/guesser",
}: GameTypeSelectorWithLeadersProps) {
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const [startingGame, setStartingGame] = useState<string | null>(null);

  const { countryTypes, worldTypes, topPlayers, loading } = useGameTypes({ excludeImageTypes });

  const labels = categoryLabels[locale] || categoryLabels.de;

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
        logger.error("Failed to create game", error);
      }
    } catch (error) {
      logger.error("Error starting game", error);
    } finally {
      setStartingGame(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column: Countries */}
      {countryTypes.length > 0 && (
        <div className="bg-surface-1 border border-surface-3 rounded-sm p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
            {labels.countries}
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {countryTypes.map((config) => (
              <GameTypeCard
                key={config.id}
                config={config}
                isSelected={selected === config.id}
                players={topPlayers[config.id] || []}
                loading={loading}
                isStarting={startingGame === config.id}
                locale={locale}
                onStartGame={() => handleStartGame(config.id)}
                onViewDetails={() => handleViewDetails(config.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Right Column: World Quiz */}
      {worldTypes.length > 0 && (
        <div className="bg-surface-1 border border-surface-3 rounded-sm p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
            {labels.worldQuiz}
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {worldTypes.map((config) => (
              <GameTypeCard
                key={config.id}
                config={config}
                isSelected={selected === config.id}
                players={topPlayers[config.id] || []}
                loading={loading}
                isStarting={startingGame === config.id}
                locale={locale}
                onStartGame={() => handleStartGame(config.id)}
                onViewDetails={() => handleViewDetails(config.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Re-export types
export type { GameTypeSelectorWithLeadersProps, TopPlayer, TopPlayersMap } from "./types";
