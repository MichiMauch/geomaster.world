"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Swords, Play, ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { decodeDuelChallenge, type DuelChallenge } from "@/lib/duel-utils";

const labels = {
  de: {
    title: "Spielmodus wählen",
    normalTitle: "Normal",
    normalDesc: "Spiele alleine und verbessere deinen Highscore",
    duelTitle: "Duell",
    duelDesc: "Fordere einen Freund heraus und vergleicht eure Ergebnisse",
    challengeTitle: "Duell-Herausforderung",
    challengeDesc: "hat dich zu einem Duell herausgefordert!",
    acceptChallenge: "DUELL ANNEHMEN",
    loginRequired: "Du musst angemeldet sein, um ein Duell zu spielen",
    loginButton: "Mit Google anmelden",
    back: "Zurück",
    starting: "Spiel wird erstellt...",
    score: "Punkte",
    time: "Sek.",
    or: "oder",
    alreadyPlayed: "Dieses Duell wurde bereits gespielt",
    alreadyPlayedDesc: "Du kannst ein Duell nur einmal spielen. Fordere deinen Gegner zu einem neuen Duell heraus!",
    ok: "Verstanden",
  },
  en: {
    title: "Choose Game Mode",
    normalTitle: "Normal",
    normalDesc: "Play solo and improve your highscore",
    duelTitle: "Duel",
    duelDesc: "Challenge a friend and compare your results",
    challengeTitle: "Duel Challenge",
    challengeDesc: "has challenged you to a duel!",
    acceptChallenge: "ACCEPT DUEL",
    loginRequired: "You must be logged in to play a duel",
    loginButton: "Sign in with Google",
    back: "Back",
    starting: "Creating game...",
    score: "Points",
    time: "Sec.",
    or: "or",
    alreadyPlayed: "This duel has already been played",
    alreadyPlayedDesc: "You can only play a duel once. Challenge your opponent to a new duel!",
    ok: "Got it",
  },
  sl: {
    title: "Izberi način igre",
    normalTitle: "Normalno",
    normalDesc: "Igraj sam in izboljšaj svoj najboljši rezultat",
    duelTitle: "Dvoboj",
    duelDesc: "Izzovi prijatelja in primerjajta rezultate",
    challengeTitle: "Izziv za dvoboj",
    challengeDesc: "te je izzval na dvoboj!",
    acceptChallenge: "SPREJMI DVOBOJ",
    loginRequired: "Za dvoboj se moraš prijaviti",
    loginButton: "Prijava z Google",
    back: "Nazaj",
    starting: "Ustvarjam igro...",
    score: "Točk",
    time: "Sek.",
    or: "ali",
    alreadyPlayed: "Ta dvoboj je bil že odigran",
    alreadyPlayedDesc: "Dvoboj lahko igraš samo enkrat. Izzovi nasprotnika na nov dvoboj!",
    ok: "Razumem",
  },
};

export default function SelectModePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params.locale as string) || "de";
  const gameType = decodeURIComponent(params.gameType as string);

  const t = labels[locale as keyof typeof labels] || labels.de;

  const [creatingGame, setCreatingGame] = useState(false);
  const [challengeData, setChallengeData] = useState<DuelChallenge | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  // Check for challenge in URL
  useEffect(() => {
    const challenge = searchParams.get("challenge");
    if (challenge) {
      const decoded = decodeDuelChallenge(challenge);
      setChallengeData(decoded);
    }
  }, [searchParams]);

  const handleStartNormal = async () => {
    setCreatingGame(true);
    try {
      const guestId = localStorage.getItem("guestId");
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

  const handleStartDuel = async () => {
    if (!session?.user?.id) {
      return; // Should not happen due to button being disabled
    }

    setCreatingGame(true);
    try {
      const challenge = searchParams.get("challenge");
      const response = await fetch("/api/ranked/games/duel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType,
          challenge: challenge || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store challenge data in sessionStorage for use after game completion
        if (challenge && challengeData) {
          sessionStorage.setItem("duelChallenge", JSON.stringify(challengeData));
        }
        router.push(`/${locale}/guesser/play/${data.gameId}`);
      } else {
        const errData = await response.json();
        if (errData.error === "already_played") {
          setErrorModal("alreadyPlayed");
        } else {
          setErrorModal(errData.error || "Failed to create duel");
        }
      }
    } catch (error) {
      console.error("Error creating duel:", error);
      setErrorModal("Failed to create duel");
    } finally {
      setCreatingGame(false);
    }
  };

  const isLoading = status === "loading";
  const isLoggedIn = !!session?.user?.id;

  // If there's a challenge, show the challenge acceptance UI
  if (challengeData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="absolute inset-0 -z-10">
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage: 'url("/images/hero-map-bg.jpg")',
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
        </div>

        <Card variant="glass-elevated" padding="lg" className="max-w-md w-full animate-fade-in">
          <CardContent className="text-center space-y-6 pt-4">
            {/* Challenge Icon */}
            <div className="w-20 h-20 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
              <Swords className="w-10 h-10 text-accent" />
            </div>

            {/* Challenge Title */}
            <div>
              <h1 className="text-2xl font-bold text-text-primary font-heading mb-2">
                {t.challengeTitle}
              </h1>
              <p className="text-lg text-primary font-semibold">
                {challengeData.challengerName}
              </p>
              <p className="text-text-secondary">
                {t.challengeDesc}
              </p>
            </div>

            {/* Challenger Stats */}
            <div className="flex justify-center gap-8 py-4 border-y border-glass-border">
              <div className="text-center">
                <p className="text-2xl font-bold text-accent">{challengeData.challengerScore.toLocaleString()}</p>
                <p className="text-sm text-text-muted">{t.score}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{challengeData.challengerTime.toFixed(1)}</p>
                <p className="text-sm text-text-muted">{t.time}</p>
              </div>
            </div>

            {/* Login/Accept Section */}
            {!isLoggedIn ? (
              <div className="space-y-3">
                <p className="text-text-muted text-sm">{t.loginRequired}</p>
                <Button
                  onClick={() => signIn("google")}
                  variant="accent"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {t.loginButton}
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleStartDuel}
                variant="accent"
                size="xl"
                className="w-full glow-accent"
                disabled={creatingGame}
                isLoading={creatingGame}
              >
                {creatingGame ? t.starting : t.acceptChallenge}
              </Button>
            )}

            {/* Back Link */}
            <Link href={`/${locale}/guesser/${gameType}`}>
              <Button variant="ghost" size="sm" className="text-text-muted">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.back}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Error Modal */}
        {errorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <Card variant="glass-elevated" padding="lg" className="max-w-sm w-full mx-4 animate-fade-in">
              <CardContent className="text-center space-y-4 pt-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
                  <Swords className="w-8 h-8 text-accent" />
                </div>
                <h2 className="text-xl font-bold text-text-primary">{t.alreadyPlayed}</h2>
                <p className="text-text-secondary text-sm">{t.alreadyPlayedDesc}</p>
                <Button variant="accent" size="lg" className="w-full" onClick={() => {
                  setErrorModal(null);
                  router.push(`/${locale}/guesser/${gameType}`);
                }}>
                  {t.ok}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Regular mode selection UI
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: 'url("/images/hero-map-bg.jpg")',
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
      </div>

      <div className="max-w-2xl w-full space-y-6 animate-fade-in">
        {/* Title */}
        <h1 className="text-3xl font-bold text-text-primary font-heading text-center">
          {t.title}
        </h1>

        {/* Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Normal Mode */}
          <Card
            variant="interactive"
            padding="lg"
            className="cursor-pointer hover:border-primary/50 transition-all group"
            onClick={handleStartNormal}
          >
            <CardContent className="text-center space-y-4 pt-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                <Play className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary font-heading">
                  {t.normalTitle}
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  {t.normalDesc}
                </p>
              </div>
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                disabled={creatingGame}
                isLoading={creatingGame}
              >
                {creatingGame ? t.starting : t.normalTitle}
              </Button>
            </CardContent>
          </Card>

          {/* Duel Mode */}
          <Card
            variant="interactive"
            padding="lg"
            className={`transition-all ${
              isLoggedIn
                ? "cursor-pointer hover:border-accent/50 group"
                : "opacity-75"
            }`}
            onClick={isLoggedIn ? handleStartDuel : undefined}
          >
            <CardContent className="text-center space-y-4 pt-4">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-colors ${
                isLoggedIn ? "bg-accent/20 group-hover:bg-accent/30" : "bg-surface-2"
              }`}>
                <Swords className={`w-8 h-8 ${isLoggedIn ? "text-accent" : "text-text-muted"}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary font-heading">
                  {t.duelTitle}
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  {t.duelDesc}
                </p>
              </div>

              {isLoggedIn ? (
                <Button
                  variant="accent"
                  size="lg"
                  className="w-full"
                  disabled={creatingGame}
                  isLoading={creatingGame}
                >
                  {creatingGame ? t.starting : t.duelTitle}
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-text-muted">{t.loginRequired}</p>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      signIn("google");
                    }}
                    variant="outline"
                    size="md"
                    className="w-full"
                    disabled={isLoading}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {t.loginButton}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link href={`/${locale}/guesser/${gameType}`}>
            <Button variant="ghost" size="sm" className="text-text-muted">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.back}
            </Button>
          </Link>
        </div>
      </div>

      {/* Error Modal */}
      {errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Card variant="glass-elevated" padding="lg" className="max-w-sm w-full mx-4 animate-fade-in">
            <CardContent className="text-center space-y-4 pt-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
                <Swords className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">{t.alreadyPlayed}</h2>
              <p className="text-text-secondary text-sm">{t.alreadyPlayedDesc}</p>
              <Button variant="accent" size="lg" className="w-full" onClick={() => {
                setErrorModal(null);
                router.push(`/${locale}/guesser/${gameType}`);
              }}>
                {t.ok}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
