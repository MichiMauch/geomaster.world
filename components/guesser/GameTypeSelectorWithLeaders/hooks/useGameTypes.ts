"use client";

import { useEffect, useState, useMemo } from "react";
import { GAME_TYPES } from "@/lib/game-types";
import {
  countriesToGameTypeConfigs,
  getActiveCountries,
  worldQuizToGameTypeConfig,
  type DatabaseCountry,
  type DatabaseWorldQuizType,
} from "@/lib/utils/country-converter";
import type { GameTypeData, TopPlayersMap } from "../types";

interface UseGameTypesOptions {
  excludeImageTypes?: boolean;
}

export function useGameTypes({ excludeImageTypes = true }: UseGameTypesOptions = {}) {
  const [dbCountries, setDbCountries] = useState<DatabaseCountry[]>([]);
  const [dbWorldQuizTypes, setDbWorldQuizTypes] = useState<DatabaseWorldQuizType[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [worldQuizTypesLoading, setWorldQuizTypesLoading] = useState(true);
  const [topPlayers, setTopPlayers] = useState<TopPlayersMap>({});
  const [playersLoading, setPlayersLoading] = useState(true);

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
  const gameTypeData: GameTypeData = useMemo(() => {
    const activeCountries = getActiveCountries(dbCountries);
    const countryConfigs = countriesToGameTypeConfigs(activeCountries);

    const activeWorldQuizTypes = dbWorldQuizTypes.filter((w) => w.isActive);
    const worldConfigs = activeWorldQuizTypes.map(worldQuizToGameTypeConfig);

    const imageTypes = excludeImageTypes
      ? []
      : Object.values(GAME_TYPES).filter((config) => config.type === "image");

    return {
      countryTypes: countryConfigs,
      worldTypes: worldConfigs,
      allGameTypes: [...countryConfigs, ...worldConfigs, ...imageTypes],
    };
  }, [dbCountries, dbWorldQuizTypes, excludeImageTypes]);

  // Fetch top 3 for each game type
  useEffect(() => {
    if (countriesLoading || worldQuizTypesLoading || gameTypeData.allGameTypes.length === 0) return;

    const fetchTopPlayers = async () => {
      setPlayersLoading(true);
      const results: TopPlayersMap = {};

      await Promise.all(
        gameTypeData.allGameTypes.map(async (config) => {
          try {
            const res = await fetch(`/api/ranked/leaderboard?gameType=${config.id}&mode=games&limit=3`);
            if (res.ok) {
              const data = await res.json();
              results[config.id] = data.rankings.map(
                (r: { rank: number; userName: string | null; bestScore: number }) => ({
                  rank: r.rank,
                  userName: r.userName,
                  bestScore: r.bestScore,
                })
              );
            }
          } catch (error) {
            console.error(`Error fetching top players for ${config.id}:`, error);
          }
        })
      );

      setTopPlayers(results);
      setPlayersLoading(false);
    };

    fetchTopPlayers();
  }, [countriesLoading, worldQuizTypesLoading, gameTypeData.allGameTypes]);

  return {
    ...gameTypeData,
    topPlayers,
    loading: countriesLoading || worldQuizTypesLoading || playersLoading,
  };
}
