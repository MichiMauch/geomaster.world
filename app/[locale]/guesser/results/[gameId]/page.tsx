"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { signIn } from "next-auth/react";
import { BarChart3, Eye, Share2 } from "lucide-react";
import { StarRating, ScoreDisplay, RoundReview } from "@/components/guesser/results";
import { LevelUpCelebration } from "@/components/LevelUpCelebration";

interface PredictedRank {
  predictedRank: number;
  totalGames: number;
}

interface GameResults {
  totalScore: number;
  gameType: string;
  gameTypeName?: string | { [locale: string]: string };
  isNewHighscore?: boolean;
  previousBestScore?: number | null;
  pointsToHighscore?: number;
}

export default function GuesserResultsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const t = useTranslations("results");
  const tRanked = useTranslations("ranked");
  const gameId = params.gameId as string;
  const locale = params.locale as string;

  // Guest-specific query params
  const guestScore = searchParams.get("guestScore");
  const guestGameType = searchParams.get("gameType");
  const isGuestResult = !!guestScore && !session?.user?.id;

  const [results, setResults] = useState<GameResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingGame, setStartingGame] = useState(false);
  const [predictedRank, setPredictedRank] = useState<PredictedRank | null>(null);
  const [showRoundReview, setShowRoundReview] = useState(false);

  // Smooth fade-in transition from LevelUp celebration
  const fromLevelUp = searchParams.get("fromLevelUp") === "true";
  const [cardVisible, setCardVisible] = useState(!fromLevelUp);

  useEffect(() => {
    if (fromLevelUp) {
      // Longer delay for page to settle, then smooth fade in
      const timer = setTimeout(() => setCardVisible(true), 400);
      return () => clearTimeout(timer);
    }
  }, [fromLevelUp]);

  // Test LevelUpCelebration with ?testLevelUp=true
  const testLevelUp = searchParams.get("testLevelUp") === "true";
  const [showLevelUpTest, setShowLevelUpTest] = useState(false);

  useEffect(() => {
    if (testLevelUp && !loading && results) {
      // Show level up after a short delay when results are loaded
      const timer = setTimeout(() => {
        setShowLevelUpTest(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [testLevelUp, loading, results]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // For guests: use score from URL and fetch predicted rank
        if (isGuestResult && guestScore && guestGameType) {
          const score = parseInt(guestScore, 10);

          // Set guest results
          setResults({
            totalScore: score,
            gameType: guestGameType,
            isNewHighscore: false,
            pointsToHighscore: 0,
          });

          // Fetch predicted rank from API
          try {
            const predictResponse = await fetch(
              `/api/ranked/leaderboard/predict?score=${score}&gameType=${encodeURIComponent(guestGameType)}`
            );
            if (predictResponse.ok) {
              const predictData = await predictResponse.json();
              setPredictedRank({
                predictedRank: predictData.predictedRank,
                totalGames: predictData.totalGames,
              });
            }
          } catch (predictError) {
            console.error("Error fetching predicted rank:", predictError);
          }
        } else {
          // For logged-in users: fetch results from API
          const response = await fetch(`/api/ranked/games/${gameId}/results`);
          if (response.ok) {
            const data = await response.json();
            setResults(data);
          }
        }
      } catch (error) {
        console.error("Error fetching results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [gameId, isGuestResult, guestScore, guestGameType]);

  // Start a new game directly
  const handlePlayAgain = async () => {
    if (!results?.gameType) {
      router.push(`/${locale}/guesser`);
      return;
    }

    setStartingGame(true);
    try {
      const guestId = localStorage.getItem("guestId");
      const response = await fetch("/api/ranked/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameType: results.gameType, guestId }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/${locale}/guesser/play/${data.gameId}`);
      } else {
        // Fallback to game type page
        router.push(`/${locale}/guesser/${results.gameType}`);
      }
    } catch (error) {
      console.error("Error creating game:", error);
      router.push(`/${locale}/guesser/${results.gameType}`);
    } finally {
      setStartingGame(false);
    }
  };

  // Go to game type page (shows leaderboard)
  const handleViewLeaderboard = () => {
    if (results?.gameType) {
      router.push(`/${locale}/guesser/${results.gameType}`);
    } else {
      router.push(`/${locale}/guesser`);
    }
  };

  // Get localized game type name
  const getLocalizedGameTypeName = (): string => {
    if (!results) return "";
    const name = results.gameTypeName;
    if (typeof name === "object" && name !== null) {
      return name[locale] || name.en || results.gameType;
    }
    return name || results.gameType;
  };

  // Share result
  const handleShare = async () => {
    if (!results) return;
    const shareUrl = `${window.location.origin}/${locale}/guesser/${results.gameType}`;
    const gameName = getLocalizedGameTypeName();
    const text =
      locale === "de"
        ? `Ich habe bei GeoMaster ${results.totalScore} Punkte im Spiel "${gameName}" erreicht! Kannst du mich schlagen?`
        : locale === "sl"
        ? `V igri GeoMaster sem dosegel ${results.totalScore} točk v "${gameName}"! Me lahko premagas?`
        : `I scored ${results.totalScore} points in "${gameName}" on GeoMaster! Can you beat me?`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "GeoMaster", text, url: shareUrl });
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(`${text} ${shareUrl}`);
    }
  };

  // Background component for reuse
  const BackgroundMap = () => (
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
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
    </div>
  );

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <BackgroundMap />
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!results) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <BackgroundMap />
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center">
          <p className="text-text-muted">
            {tRanked("resultsNotFound", { defaultValue: "Ergebnisse nicht gefunden" })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <BackgroundMap />

      {/* Main Card - Very transparent, with fade-in from LevelUp */}
      <div
        className={`w-full max-w-md rounded-2xl border border-white/10 p-6 sm:p-8 text-center transition-opacity duration-700 ease-out ${
          cardVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{ backgroundColor: "rgba(0, 0, 0, 0.08)", backdropFilter: "blur(8px)" }}
      >
        {/* 1. Title ("Starke Leistung!") */}
        <ScoreDisplay score={results.totalScore} titleOnly />

        {/* 2. Stars in arc - centered between title and rank */}
        <div style={{ paddingTop: "24px", paddingBottom: "24px" }}>
          <StarRating score={results.totalScore} />
        </div>

        {/* 3. Rank ("Rang: Entdecker") */}
        <div style={{ marginBottom: "16px" }}>
          <ScoreDisplay score={results.totalScore} rankOnly />
        </div>

        {/* 4. Score (438) */}
        <ScoreDisplay
          score={results.totalScore}
          scoreOnly
        />

        {/* 5. Highscore Badge */}
        <ScoreDisplay
          score={results.totalScore}
          isNewHighscore={results.isNewHighscore}
          pointsToHighscore={results.pointsToHighscore}
          highscoreOnly
          className="mb-4"
        />

        {/* Login Prompt for Guests */}
        {!session?.user?.id && (
          <div className="p-4 rounded-xl bg-surface-2/30 border border-glass-border space-y-3">
            {predictedRank && (
              <p className="text-primary font-semibold">
                {locale === "de" ? (
                  <>
                    Mit {results.totalScore} Punkten wärst du auf{" "}
                    <span className="text-xl">Platz {predictedRank.predictedRank}</span> von{" "}
                    {predictedRank.totalGames}!
                  </>
                ) : locale === "sl" ? (
                  <>
                    Z {results.totalScore} točkami bi bil na{" "}
                    <span className="text-xl">{predictedRank.predictedRank}. mestu</span> od{" "}
                    {predictedRank.totalGames}!
                  </>
                ) : (
                  <>
                    With {results.totalScore} points, you would be{" "}
                    <span className="text-xl">rank {predictedRank.predictedRank}</span> of{" "}
                    {predictedRank.totalGames}!
                  </>
                )}
              </p>
            )}
            <p className="text-sm text-text-muted">
              {tRanked("loginToRank", {
                defaultValue: "Melde dich an, um in den Rankings zu erscheinen!",
              })}
            </p>
            <Button onClick={() => signIn("google")} variant="accent" size="sm">
              {tRanked("login", { defaultValue: "Mit Google anmelden" })}
            </Button>
          </div>
        )}

        {/* Primary Action - Play Again */}
        <Button
          onClick={handlePlayAgain}
          variant="primary"
          size="lg"
          disabled={startingGame}
          isLoading={startingGame}
          className="w-full glow-primary mb-3"
        >
          {startingGame
            ? t("creating", { defaultValue: "Erstelle Spiel..." })
            : t("playAgain", { defaultValue: "Nochmal spielen" })}
        </Button>

        {/* Secondary Actions - 3 buttons like mockup */}
        <div className="flex gap-2 sm:gap-3 mt-2">
          <Button
            onClick={handleViewLeaderboard}
            variant="outline"
            size="md"
            className="flex-1 gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">{t("leaderboard", { defaultValue: "Rangliste" })}</span>
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            size="icon"
            className="shrink-0"
          >
            <Share2 className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setShowRoundReview(true)}
            variant="outline"
            size="md"
            className="flex-1 gap-2"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">{t("viewAnswers", { defaultValue: "Antworten ansehen" })}</span>
          </Button>
        </div>
      </div>

      {/* Round Review Modal */}
      <RoundReview
        gameId={gameId}
        isOpen={showRoundReview}
        onClose={() => setShowRoundReview(false)}
      />

      {/* Test LevelUpCelebration with ?testLevelUp=true */}
      <LevelUpCelebration
        isOpen={showLevelUpTest}
        onClose={() => setShowLevelUpTest(false)}
        newLevel={5}
        newLevelName="Entdecker"
        locale={locale}
      />
    </div>
  );
}
