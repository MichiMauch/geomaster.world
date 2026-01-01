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

  const handlePlayAgain = () => {
    if (results?.gameType) {
      router.push(`/${locale}/guesser/${results.gameType}`);
    } else {
      router.push(`/${locale}/guesser`);
    }
  };

  const handleViewLeaderboard = () => {
    if (results?.gameType) {
      router.push(`/${locale}/guesser/${results.gameType}`);
    } else {
      router.push(`/${locale}/guesser/leaderboards`);
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
      <Card className="p-8 mb-6 text-center bg-gradient-to-br from-primary/10 to-accent/10">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          {t("gameComplete", { defaultValue: "Spiel abgeschlossen!" })}
        </h1>
        <div className="text-6xl font-bold text-primary my-4">
          {results.totalScore}
        </div>
      </Card>

      {/* Rankings (if logged in) */}
      {session?.user?.id && results.rankings && (
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {t("yourRankings", { defaultValue: "Deine Rankings" })}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">{t("daily", { defaultValue: "Täglich" })}</div>
              <div className="text-2xl font-bold text-primary">
                #{results.rankings.daily?.rank || "-"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">{t("weekly", { defaultValue: "Wöchentlich" })}</div>
              <div className="text-2xl font-bold text-primary">
                #{results.rankings.weekly?.rank || "-"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">{t("monthly", { defaultValue: "Monatlich" })}</div>
              <div className="text-2xl font-bold text-primary">
                #{results.rankings.monthly?.rank || "-"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">{t("alltime", { defaultValue: "Gesamt" })}</div>
              <div className="text-2xl font-bold text-primary">
                #{results.rankings.alltime?.rank || "-"}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Login Prompt for Guests */}
      {!session?.user?.id && (
        <Card className="p-6 mb-6 bg-accent/10 border-accent">
          <div className="text-center">
            <h3 className="font-semibold text-foreground mb-2">
              {t("loginToRank", { defaultValue: "Melde dich an, um in den Rankings zu erscheinen!" })}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("loginDescription", { defaultValue: "Erstelle ein Konto, um deine Ergebnisse zu speichern und mit anderen zu konkurrieren." })}
            </p>
            <Button onClick={() => signIn("google")} variant="primary">
              {t("login", { defaultValue: "Mit Google anmelden" })}
            </Button>
          </div>
        </Card>
      )}

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Button onClick={handlePlayAgain} size="lg" variant="primary">
            {t("playAgain", { defaultValue: "Nochmal spielen" })}
          </Button>
          <Button onClick={handleViewLeaderboard} size="lg" variant="outline">
            {t("viewLeaderboard", { defaultValue: "Rangliste ansehen" })}
          </Button>
        </div>
      </div>
    </div>
  );
}
