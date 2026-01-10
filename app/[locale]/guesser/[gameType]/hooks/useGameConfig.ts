"use client";

import { useState, useEffect } from "react";
import { GAME_TYPES, type GameTypeConfig } from "@/lib/game-types";
import {
  countryToGameTypeConfig,
  worldQuizToGameTypeConfig,
  panoramaToGameTypeConfig,
  type DatabaseCountry,
  type DatabaseWorldQuizType,
  type DatabasePanoramaType,
} from "@/lib/utils/country-converter";

export function useGameConfig(gameType: string) {
  const [gameConfig, setGameConfig] = useState<GameTypeConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      // Check static GAME_TYPES first (only for image: types now)
      if (GAME_TYPES[gameType]) {
        setGameConfig(GAME_TYPES[gameType]);
        setLoading(false);
        return;
      }

      // If it's a country type, try to fetch from database
      if (gameType.startsWith("country:")) {
        const countryId = gameType.split(":")[1];
        try {
          const res = await fetch(`/api/countries?active=true`, { cache: 'no-store' });
          if (res.ok) {
            const countries: DatabaseCountry[] = await res.json();
            const country = countries.find((c) => c.id === countryId);
            if (country) {
              setGameConfig(countryToGameTypeConfig(country));
              setLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error("Error fetching country config:", error);
        }
      }

      // If it's a world quiz type, try to fetch from database
      if (gameType.startsWith("world:")) {
        const worldQuizId = gameType.split(":")[1];
        try {
          const res = await fetch(`/api/world-quiz-types?active=true`, { cache: 'no-store' });
          if (res.ok) {
            const worldQuizTypes: DatabaseWorldQuizType[] = await res.json();
            const worldQuiz = worldQuizTypes.find((w) => w.id === worldQuizId);
            if (worldQuiz) {
              setGameConfig(worldQuizToGameTypeConfig(worldQuiz));
              setLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error("Error fetching world quiz config:", error);
        }
      }

      // If it's a panorama type, try to fetch from database
      if (gameType.startsWith("panorama:")) {
        const panoramaId = gameType.split(":")[1];
        try {
          const res = await fetch(`/api/panorama-types?active=true`, { cache: 'no-store' });
          if (res.ok) {
            const panoramaTypes: DatabasePanoramaType[] = await res.json();
            const panorama = panoramaTypes.find((p) => p.id === panoramaId);
            if (panorama) {
              setGameConfig(panoramaToGameTypeConfig(panorama));
              setLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error("Error fetching panorama config:", error);
        }
      }

      // Invalid game type - will trigger redirect
      setGameConfig(null);
      setLoading(false);
    };

    loadConfig();
  }, [gameType]);

  return { gameConfig, loading };
}
