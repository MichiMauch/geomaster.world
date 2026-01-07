"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { signIn } from "next-auth/react";

interface PredictedRank {
  predictedRank: number;
  totalGames: number;
}

export default function GuesserResultsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const t = useTranslations("ranked");
  const gameId = params.gameId as string;
  const locale = params.locale as string;

  // Guest-specific query params
  const guestScore = searchParams.get("guestScore");
  const guestGameType = searchParams.get("gameType");
  const isGuestResult = !!guestScore && !session?.user?.id;

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startingGame, setStartingGame] = useState(false);
  const [predictedRank, setPredictedRank] = useState<PredictedRank | null>(null);

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
    // If it's an object with locale keys, get the right one
    if (typeof name === "object" && name !== null) {
      return name[locale] || name.en || results.gameType;
    }
    // Otherwise use as string or fallback to gameType
    return name || results.gameType;
  };

  // Share result on WhatsApp
  const handleWhatsAppShare = () => {
    if (!results) return;
    const shareUrl = `${window.location.origin}/${locale}/guesser/${results.gameType}`;
    const gameName = getLocalizedGameTypeName();
    const text = t("shareText", {
      gameName,
      score: results.totalScore,
      url: shareUrl,
      defaultValue: `I played GeoMaster! In the game "${gameName}", I scored ${results.totalScore} points. Can you beat me? ${shareUrl}`
    });
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="relative min-h-screen">
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
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="relative min-h-screen">
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
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">{t("resultsNotFound", { defaultValue: "Ergebnisse nicht gefunden" })}</p>
          </Card>
        </div>
      </div>
    );
  }

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

      <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Completion Header */}
      <Card className="p-6 sm:p-8 mb-6 text-center bg-gradient-to-br from-primary/10 to-accent/10">
        <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-2">
          {t("gameComplete", { defaultValue: "Spiel abgeschlossen!" })}
        </h1>
        <div className="text-5xl sm:text-6xl font-bold text-primary my-4">
          {results.totalScore}
        </div>
        <p className="text-sm text-muted-foreground">
          {t("points", { defaultValue: "Punkte" })}
        </p>
      </Card>

      {/* Login Prompt for Guests with Predicted Rank */}
      {!session?.user?.id && (
        <Card className="p-4 sm:p-6 mb-6 bg-accent/10 border-accent">
          <div className="text-center">
            {/* Show predicted rank if available */}
            {predictedRank && (
              <div className="mb-4 p-3 bg-primary/10 rounded-lg">
                <p className="text-lg sm:text-xl font-bold text-primary">
                  {locale === "de" ? (
                    <>Mit {results?.totalScore} Punkten wärst du auf <span className="text-2xl">Platz {predictedRank.predictedRank}</span> von {predictedRank.totalGames}!</>
                  ) : locale === "sl" ? (
                    <>Z {results?.totalScore} točkami bi bil na <span className="text-2xl">{predictedRank.predictedRank}. mestu</span> od {predictedRank.totalGames}!</>
                  ) : (
                    <>With {results?.totalScore} points, you would be <span className="text-2xl">rank {predictedRank.predictedRank}</span> of {predictedRank.totalGames}!</>
                  )}
                </p>
              </div>
            )}
            <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">
              {t("loginToRank", { defaultValue: "Melde dich an, um in den Rankings zu erscheinen!" })}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              {t("loginDescription", { defaultValue: "Erstelle ein Konto, um deine Ergebnisse zu speichern und mit anderen zu konkurrieren." })}
            </p>
            <Button onClick={() => signIn("google")} variant="primary" size="sm" className="sm:text-base">
              {t("login", { defaultValue: "Mit Google anmelden" })}
            </Button>
          </div>
        </Card>
      )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button
            onClick={handlePlayAgain}
            size="lg"
            variant="primary"
            disabled={startingGame}
            className="w-full sm:w-auto"
          >
            {startingGame ? t("creating", { defaultValue: "Erstelle Spiel..." }) : t("playAgain", { defaultValue: "Erneut spielen" })}
          </Button>
          <Button
            onClick={handleViewLeaderboard}
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
          >
            {t("viewLeaderboard", { defaultValue: "Rangliste ansehen" })}
          </Button>
        </div>

        {/* WhatsApp Share */}
        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleWhatsAppShare}
            size="lg"
            variant="success"
            className="w-full sm:w-auto gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {t("shareWhatsApp", { defaultValue: "Mit WhatsApp teilen" })}
          </Button>
        </div>
      </div>
    </div>
  );
}
