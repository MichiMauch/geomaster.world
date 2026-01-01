"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { signIn } from "next-auth/react";

export default function GuesserResultsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations("ranked");
  const gameId = params.gameId as string;
  const locale = params.locale as string;

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startingGame, setStartingGame] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/ranked/games/${gameId}/results`);
        if (response.ok) {
          const data = await response.json();
          setResults(data);
        }
      } catch (error) {
        console.error("Error fetching results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [gameId]);

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

      {/* Login Prompt for Guests */}
      {!session?.user?.id && (
        <Card className="p-4 sm:p-6 mb-6 bg-accent/10 border-accent">
          <div className="text-center">
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
      </div>
    </div>
  );
}
