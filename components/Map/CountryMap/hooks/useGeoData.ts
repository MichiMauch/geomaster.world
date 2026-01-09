"use client";

import { useState, useEffect } from "react";
import type { GameTypeConfig } from "@/lib/game-types";
import { logger } from "@/lib/logger";
import type { DynamicCountryConfig, DynamicWorldQuizConfig } from "../types";

interface UseGeoDataOptions {
  dynamicCountry?: DynamicCountryConfig;
  dynamicWorldQuiz?: DynamicWorldQuizConfig;
  gameTypeConfig: GameTypeConfig | null;
}

export function useGeoData({ dynamicCountry, dynamicWorldQuiz, gameTypeConfig }: UseGeoDataOptions) {
  const [mounted, setMounted] = useState(false);
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);

  // Determine GeoJSON URL
  const geoJsonUrl = dynamicWorldQuiz
    ? "/world.geojson" // All world quiz types use the same world map
    : dynamicCountry
      ? `/api/countries/${dynamicCountry.id}/geojson`
      : gameTypeConfig?.geoJsonFile;

  useEffect(() => {
    setMounted(true);
    setGeoData(null); // Reset geoData to ensure fresh load on gameType change

    if (!geoJsonUrl) return;

    // Load GeoJSON data
    fetch(geoJsonUrl)
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => logger.error("Error loading GeoJSON", err));
  }, [geoJsonUrl]);

  return { mounted, geoData };
}
