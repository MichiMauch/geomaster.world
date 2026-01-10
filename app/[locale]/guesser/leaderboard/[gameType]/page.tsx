"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { GAME_TYPES, type GameTypeConfig } from "@/lib/game-types";
import {
  countryToGameTypeConfig,
  worldQuizToGameTypeConfig,
  type DatabaseCountry,
  type DatabaseWorldQuizType,
} from "@/lib/utils/country-converter";

interface RankingEntry {
  rank: number;
  userName: string | null;
  userImage?: string | null;
  bestScore: number;
}

const ITEMS_PER_LOAD = 20;

export default function LeaderboardPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const gameType = decodeURIComponent(params.gameType as string);
  const t = useTranslations("ranked");
  const tCommon = useTranslations("common");

  // Game config state
  const [gameConfig, setGameConfig] = useState<GameTypeConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  // Rankings state
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // Load game config
  useEffect(() => {
    const loadConfig = async () => {
      // Check static GAME_TYPES first
      if (GAME_TYPES[gameType]) {
        setGameConfig(GAME_TYPES[gameType]);
        setConfigLoading(false);
        return;
      }

      // If it's a country type, try to fetch from database
      if (gameType.startsWith("country:")) {
        const countryId = gameType.split(":")[1];
        try {
          const res = await fetch(`/api/countries?active=true`);
          if (res.ok) {
            const countries: DatabaseCountry[] = await res.json();
            const country = countries.find((c) => c.id === countryId);
            if (country) {
              setGameConfig(countryToGameTypeConfig(country));
              setConfigLoading(false);
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
          const res = await fetch(`/api/world-quiz-types?active=true`);
          if (res.ok) {
            const worldQuizTypes: DatabaseWorldQuizType[] = await res.json();
            const worldQuiz = worldQuizTypes.find((w) => w.id === worldQuizId);
            if (worldQuiz) {
              setGameConfig(worldQuizToGameTypeConfig(worldQuiz));
              setConfigLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error("Error fetching world quiz config:", error);
        }
      }

      // Invalid game type - will trigger redirect
      setGameConfig(null);
      setConfigLoading(false);
    };

    loadConfig();
  }, [gameType]);

  // Redirect if invalid game type
  useEffect(() => {
    if (!configLoading && !gameConfig) {
      router.push(`/${locale}/guesser`);
    }
  }, [configLoading, gameConfig, router, locale]);

  // Initial load of rankings
  useEffect(() => {
    const fetchInitialRankings = async () => {
      setLoading(true);
      try {
        const url = `/api/ranked/leaderboard?gameType=${gameType}&mode=games&limit=${ITEMS_PER_LOAD}&offset=0`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const newRankings = data.rankings || [];
          setRankings(newRankings);
          setOffset(ITEMS_PER_LOAD);
          setHasMore(newRankings.length >= ITEMS_PER_LOAD);
        }
      } catch (error) {
        console.error("Error fetching rankings:", error);
      } finally {
        setLoading(false);
      }
    };

    if (gameType) {
      fetchInitialRankings();
    }
  }, [gameType]);

  // Load more function
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const url = `/api/ranked/leaderboard?gameType=${gameType}&mode=games&limit=${ITEMS_PER_LOAD}&offset=${offset}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const newRankings = data.rankings || [];
        setRankings((prev) => [...prev, ...newRankings]);
        setOffset((prev) => prev + ITEMS_PER_LOAD);
        setHasMore(newRankings.length >= ITEMS_PER_LOAD);
      }
    } catch (error) {
      console.error("Error loading more rankings:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [gameType, offset, loadingMore, hasMore]);

  // Loading state
  if (configLoading || !gameConfig) {
    return null;
  }

  const gameName = gameConfig.name[locale as keyof typeof gameConfig.name] || gameConfig.name.de;

  // Top 3 for podium
  const top3 = rankings.slice(0, 3);
  // Fill with empty entries if less than 3
  while (top3.length < 3) {
    top3.push({ rank: top3.length + 1, userName: null, bestScore: 0 });
  }

  // Podium order: 2nd, 1st, 3rd (for visual display)
  const podiumOrder = [top3[1], top3[0], top3[2]];
  const heights = ["h-32", "h-40", "h-28"];
  const positions = [2, 1, 3];

  const podiumStyles = [
    // Silver (2nd place)
    {
      bg: "bg-gray-400/15",
      border: "border-gray-300/60",
      glow: "shadow-[0_0_15px_rgba(192,192,192,0.4),inset_0_0_10px_rgba(192,192,192,0.1)]",
      numberColor: "text-gray-300",
    },
    // Gold (1st place)
    {
      bg: "bg-yellow-500/20",
      border: "border-yellow-400/70",
      glow: "shadow-[0_0_20px_rgba(255,215,0,0.5),inset_0_0_15px_rgba(255,215,0,0.15)]",
      numberColor: "text-yellow-400",
    },
    // Bronze (3rd place)
    {
      bg: "bg-amber-600/15",
      border: "border-amber-500/60",
      glow: "shadow-[0_0_15px_rgba(205,127,50,0.4),inset_0_0_10px_rgba(205,127,50,0.1)]",
      numberColor: "text-amber-400",
    },
  ];

  const avatarRingColors = [
    "ring-2 ring-gray-300 ring-offset-2 ring-offset-background",
    "ring-4 ring-yellow-400 ring-offset-2 ring-offset-background shadow-[0_0_20px_rgba(255,215,0,0.6)]",
    "ring-2 ring-amber-500 ring-offset-2 ring-offset-background",
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 -z-10">
        {gameConfig.backgroundImage ? (
          <Image
            src={gameConfig.backgroundImage}
            alt=""
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage: 'url("/images/hero-map-bg.jpg")',
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
      </div>

      <div className="container max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {gameConfig.landmarkImage && (
              <div className="relative w-16 h-16 flex-shrink-0">
                <Image
                  src={gameConfig.landmarkImage}
                  alt={gameName}
                  fill
                  className="object-contain drop-shadow-[0_0_15px_rgba(0,217,255,0.4)]"
                />
              </div>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground font-heading">
                {t("leaderboardTitle")}
              </h1>
              <p className="text-text-secondary">{gameName}</p>
            </div>
          </div>
          <Link
            href={`/${locale}/guesser/${encodeURIComponent(gameType)}`}
            className="text-primary hover:text-primary-light transition-colors text-sm"
          >
            ← {t("backToGame")}
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {/* Podium Skeleton */}
            <div className="flex items-end justify-center gap-3 pt-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="relative animate-pulse">
                  <div className="w-28 md:w-32 rounded-t-xl bg-surface-2/50" style={{ height: i === 2 ? '10rem' : i === 1 ? '8rem' : '7rem' }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-surface-2" />
                  </div>
                </div>
              ))}
            </div>
            {/* List Skeleton */}
            <div className="glass-card rounded-lg p-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-12 bg-surface-1/30 rounded mb-1 animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Podium */}
            <div className="flex items-end justify-center gap-3 pt-12 mb-6">
              {podiumOrder.map((entry, index) => {
                const isEmpty = !entry?.userName && entry?.bestScore === 0;
                const position = positions[index];
                const style = podiumStyles[index];

                return (
                  <div key={index} className="relative">
                    <div
                      className={cn(
                        "w-28 md:w-32 rounded-t-xl border-2 backdrop-blur-sm transition-all relative",
                        heights[index],
                        style.bg,
                        style.border,
                        style.glow
                      )}
                    >
                      {/* Avatar */}
                      <div className={cn(
                        "absolute left-1/2 -translate-x-1/2 transition-transform hover:scale-110",
                        position === 1 ? "-top-10 scale-110" : "-top-8"
                      )}>
                        <Avatar
                          size={position === 1 ? "xl" : "lg"}
                          src={entry?.userImage}
                          name={entry?.userName || "?"}
                          className={cn(avatarRingColors[index])}
                        />
                      </div>

                      {/* Position Number */}
                      <div className={cn(
                        "absolute inset-x-0 text-center",
                        position === 1 ? "top-8" : "top-5"
                      )}>
                        <span className={cn("text-3xl font-bold", style.numberColor)}>
                          {position}
                        </span>
                      </div>

                      {/* Name & Score */}
                      <div className="absolute inset-x-0 bottom-1 text-center">
                        <span className={cn(
                          "text-sm font-semibold truncate max-w-[90px] block mx-auto",
                          isEmpty ? "text-white/50" : "text-white"
                        )}>
                          {entry?.userName || "—"}
                        </span>
                        <span className={cn(
                          "text-lg font-bold block",
                          position === 1 ? "text-yellow-300" : "text-white"
                        )}>
                          {isEmpty ? "—" : entry?.bestScore?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rankings List (4+) */}
            {rankings.length > 3 && (
              <div className="glass-card rounded-lg p-3 mb-4">
                {rankings.slice(3).map((entry, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 py-3 px-3 transition-colors border-b border-surface-3 last:border-b-0 hover:bg-surface-1/30"
                  >
                    <span className="w-8 text-right text-sm font-medium text-muted-foreground">
                      {index + 4}.
                    </span>
                    <Avatar
                      size="sm"
                      src={entry.userImage}
                      name={entry.userName || "?"}
                    />
                    <span className="text-foreground truncate flex-1">
                      {entry.userName || t("anonymous")}
                    </span>
                    <span className="text-foreground font-bold tabular-nums">
                      {entry.bestScore.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center">
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  variant="secondary"
                  size="lg"
                >
                  {loadingMore ? tCommon("loading") : t("loadMore")}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
