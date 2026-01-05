"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getGameTypeConfig, GAME_TYPES, type GameTypeConfig } from "@/lib/game-types";
import { nanoid } from "nanoid";
import { cn } from "@/lib/utils";
import { countryToGameTypeConfig, worldQuizToGameTypeConfig, type DatabaseCountry, type DatabaseWorldQuizType } from "@/lib/utils/country-converter";
import { LoginCard } from "@/components/auth/LoginCard";

interface RankingEntry {
  rank: number;
  userName: string | null;
  bestScore: number;
  totalScore?: number;
  totalGames?: number;
}

type TabType = "weekly" | "best" | "total";

const ITEMS_PER_PAGE = 10;

export default function GuesserGameTypePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const gameType = decodeURIComponent(params.gameType as string);
  const t = useTranslations("ranked");

  // Game config state - may be loaded from static GAME_TYPES or fetched from DB
  const [gameConfig, setGameConfig] = useState<GameTypeConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  // Load game config - check static first, then fetch from DB if needed
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

  // Tab and pagination state
  const [activeTab, setActiveTab] = useState<TabType>("best");
  const [currentPage, setCurrentPage] = useState(1);
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingRankings, setLoadingRankings] = useState(true);

  // User stats state
  const [userStats, setUserStats] = useState<any>(null);
  const [userGameStats, setUserGameStats] = useState<{
    gamesCount: number;
    bestScore: number;
    totalScore: number;
    rank: number | null;
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Game creation state
  const [creatingGame, setCreatingGame] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);

  // Initialize guestId for non-logged-in users
  useEffect(() => {
    if (!session?.user?.id) {
      const stored = localStorage.getItem("guestId");
      if (stored) {
        setGuestId(stored);
      } else {
        const newGuestId = nanoid();
        localStorage.setItem("guestId", newGuestId);
        setGuestId(newGuestId);
      }
    }
  }, [session]);

  // Redirect if invalid game type (only after loading is complete)
  useEffect(() => {
    if (!configLoading && !gameConfig) {
      router.push(`/${locale}/guesser`);
    }
  }, [configLoading, gameConfig, router, locale]);

  // Fetch rankings based on active tab and page
  useEffect(() => {
    const fetchRankings = async () => {
      setLoadingRankings(true);
      try {
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;
        let url = "";

        switch (activeTab) {
          case "weekly":
            // Individual games this week (player can appear multiple times)
            url = `/api/ranked/leaderboard?gameType=${gameType}&mode=games&period=weekly&limit=${ITEMS_PER_PAGE}&offset=${offset}`;
            break;
          case "best":
            // Individual games all time (player can appear multiple times)
            url = `/api/ranked/leaderboard?gameType=${gameType}&mode=games&limit=${ITEMS_PER_PAGE}&offset=${offset}`;
            break;
          case "total":
            // Aggregated player totals (one entry per player)
            url = `/api/ranked/leaderboard?gameType=${gameType}&period=alltime&sortBy=total&limit=${ITEMS_PER_PAGE}&offset=${offset}`;
            break;
        }

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setRankings(data.rankings || []);
          // For now, estimate total count - API should return this
          setTotalCount(data.total || data.rankings?.length || 0);
          // Store user's game stats for mode=games tabs (weekly/best)
          if (data.userGameStats !== undefined) {
            setUserGameStats(data.userGameStats);
          } else {
            setUserGameStats(null);
          }
        }
      } catch (error) {
        console.error("Error fetching rankings:", error);
      } finally {
        setLoadingRankings(false);
      }
    };

    if (gameType) {
      fetchRankings();
    }
  }, [gameType, activeTab, currentPage]);

  // Fetch user stats if logged in
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      const fetchUserStats = async () => {
        setLoadingStats(true);
        try {
          const statsRes = await fetch("/api/ranked/stats");
          if (statsRes.ok) {
            const data = await statsRes.json();
            setUserStats(data.stats);
          }
        } catch (error) {
          console.error("Error fetching user stats:", error);
        } finally {
          setLoadingStats(false);
        }
      };

      fetchUserStats();
    } else {
      setLoadingStats(false);
    }
  }, [status, session, gameType]);

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset to first page
  };

  const handleStartGame = async () => {
    setCreatingGame(true);
    try {
      const response = await fetch("/api/ranked/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameType, guestId }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/${locale}/guesser/play/${data.gameId}`);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create game");
      }
    } catch (error) {
      console.error("Error creating game:", error);
      alert("Failed to create game");
    } finally {
      setCreatingGame(false);
    }
  };

  // Show loading or nothing while validating/redirecting
  if (configLoading || !gameConfig) {
    return null;
  }

  const getRankDisplay = (index: number, page: number) => {
    const absoluteRank = (page - 1) * ITEMS_PER_PAGE + index;
    if (absoluteRank === 0) return "🥇";
    if (absoluteRank === 1) return "🥈";
    if (absoluteRank === 2) return "🥉";
    return `${absoluteRank + 1}.`;
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Personal stats - use period-specific stats for weekly/best tabs, alltime for total tab
  const isGamesMode = activeTab === "weekly" || activeTab === "best";
  const personalGames = isGamesMode
    ? (userGameStats?.gamesCount || 0)
    : (userStats?.gameTypeBreakdown?.[gameType]?.games || 0);
  const personalBest = isGamesMode
    ? (userGameStats?.bestScore || 0)
    : (userStats?.gameTypeBreakdown?.[gameType]?.bestScore || 0);
  const personalTotalScore = isGamesMode
    ? (userGameStats?.totalScore || 0)
    : (userStats?.gameTypeBreakdown?.[gameType]?.totalScore || 0);

  // Tab labels
  const tabLabels = {
    weekly: locale === "de" ? "Woche" : locale === "en" ? "Weekly" : "Teden",
    best: locale === "de" ? "Beste" : locale === "en" ? "Best" : "Najboljši",
    total: locale === "de" ? "Total" : locale === "en" ? "Total" : "Skupaj",
  };

  // Start Button Component
  const StartButton = () => (
    <Button
      onClick={handleStartGame}
      disabled={creatingGame}
      size="lg"
      variant="primary"
      className="w-full"
    >
      {creatingGame
        ? t("creating", { defaultValue: "Erstelle Spiel..." })
        : locale === "de"
        ? "Spiel starten"
        : locale === "en"
        ? "Start Game"
        : "Začni igro"}
    </Button>
  );

  // My Stats Component
  const MyStats = () => (
    <>
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
        {locale === "de" ? "Deine Stats" : locale === "en" ? "Your Stats" : "Tvoje statistike"}
      </h3>

      {loadingStats ? (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-surface-2 rounded-sm animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 bg-surface-2 rounded-sm">
            <div className="text-lg font-bold text-foreground">{personalGames}</div>
            <div className="text-xs text-muted-foreground">
              {locale === "de" ? "Spiele" : locale === "en" ? "Games" : "Igre"}
            </div>
          </div>
          <div className="text-center p-2 bg-surface-2 rounded-sm">
            <div className="text-lg font-bold text-foreground">{personalBest || "—"}</div>
            <div className="text-xs text-muted-foreground">
              {locale === "de" ? "Best" : locale === "en" ? "Best" : "Najboljši"}
            </div>
          </div>
          <div className="text-center p-2 bg-surface-2 rounded-sm">
            <div className="text-lg font-bold text-primary">
              {personalTotalScore.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {locale === "de" ? "Total" : locale === "en" ? "Total" : "Skupaj"}
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="relative min-h-screen">
      {/* Background with world map */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: 'url("/images/hero-map-bg.jpg")',
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-transparent" />
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Header Card - Full Width */}
        <Card className="p-6 mb-4">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-5xl">{gameConfig.icon}</span>
            <h1 className="text-3xl font-bold text-foreground">
              {gameConfig.name[locale as keyof typeof gameConfig.name] || gameConfig.name.de}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {locale === "de"
              ? "Rate 5 Orte so genau wie möglich. 30 Sekunden pro Ort."
              : locale === "en"
              ? "Guess 5 locations as accurately as possible. 30 seconds per location."
              : "Ugani 5 lokacij čim bolj natančno. 30 sekund na lokacijo."}
          </p>
        </Card>

        {/* Mobile Only: Play Button */}
        <Card className="p-4 mb-4 lg:hidden">
          <StartButton />
        </Card>

        {/* Two Column Grid */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left: Leaderboard (3 cols) */}
          <div className="lg:col-span-3">
            <Card className="p-4">
              {/* Tabs */}
              <div className="flex gap-2 mb-4">
                {(["weekly", "best", "total"] as TabType[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    className={cn(
                      "px-4 py-2 rounded-sm text-sm font-medium transition-colors cursor-pointer",
                      activeTab === tab
                        ? "bg-primary text-white"
                        : "bg-surface-2 text-muted-foreground hover:bg-surface-3"
                    )}
                  >
                    {tabLabels[tab]}
                  </button>
                ))}
              </div>

              {/* Rankings List */}
              {loadingRankings ? (
                <div className="space-y-2">
                  {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
                    <div key={i} className="h-8 bg-surface-2 rounded-sm animate-pulse" />
                  ))}
                </div>
              ) : rankings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  {locale === "de"
                    ? "Noch keine Einträge"
                    : locale === "en"
                    ? "No entries yet"
                    : "Še brez vnosov"}
                </p>
              ) : (
                <div className="space-y-1">
                  {rankings.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 py-2 border-b border-surface-3 last:border-0"
                    >
                      <span className="w-8 text-center text-lg">
                        {getRankDisplay(index, currentPage)}
                      </span>
                      <span className="text-foreground truncate flex-1">
                        {entry.userName || "Anonym"}
                      </span>
                      <span className="text-foreground font-bold tabular-nums">
                        {activeTab === "total" ? entry.totalScore?.toLocaleString() : entry.bestScore}
                      </span>
                      {activeTab === "total" && entry.totalGames && (
                        <span className="text-muted-foreground text-sm">
                          ({entry.totalGames})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-surface-3">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={cn(
                      "px-3 py-1.5 rounded-sm text-sm cursor-pointer",
                      currentPage === 1
                        ? "bg-surface-2 text-muted-foreground opacity-50"
                        : "bg-surface-2 text-foreground hover:bg-surface-3"
                    )}
                  >
                    {locale === "de" ? "Zurück" : locale === "en" ? "Prev" : "Nazaj"}
                  </button>

                  <span className="text-sm text-muted-foreground px-2">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={cn(
                      "px-3 py-1.5 rounded-sm text-sm cursor-pointer",
                      currentPage === totalPages
                        ? "bg-surface-2 text-muted-foreground opacity-50"
                        : "bg-surface-2 text-foreground hover:bg-surface-3"
                    )}
                  >
                    {locale === "de" ? "Weiter" : locale === "en" ? "Next" : "Naprej"}
                  </button>
                </div>
              )}
            </Card>
          </div>

          {/* Right: My Rankings + Button (1 col) - Desktop Only */}
          <div className="hidden lg:block lg:col-span-1">
            {session?.user ? (
              <Card className="p-4">
                <MyStats />
                <StartButton />
              </Card>
            ) : (
              <LoginCard />
            )}
          </div>
        </div>

        {/* Mobile Only: My Rankings at Bottom */}
        {session?.user && (
          <Card className="p-4 mt-4 lg:hidden">
            <MyStats />
          </Card>
        )}
      </div>
    </div>
  );
}
