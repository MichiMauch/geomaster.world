"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Trophy, Crown, Swords, BarChart3, ArrowLeft, RefreshCcw } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { RevancheChallengeModal } from "@/components/duel/RevancheChallengeModal";

interface DuelResult {
  id: string;
  duelSeed: string;
  gameType: string;
  challengerId: string;
  challengerName: string;
  challengerScore: number;
  challengerTime: number;
  accepterId: string;
  accepterName: string;
  accepterScore: number;
  accepterTime: number;
  winnerId: string;
  winnerName: string;
  createdAt: string;
}

const labels = {
  de: {
    title: "Duell-Ergebnis",
    vs: "VS",
    winner: "SIEGER",
    draw: "UNENTSCHIEDEN",
    points: "Punkte",
    time: "Sek.",
    challenger: "Herausforderer",
    accepter: "Angenommen",
    playAgain: "Nochmal spielen",
    revanche: "Revanche",
    leaderboard: "Duell-Rangliste",
    backToGames: "Zurück zur Spielübersicht",
    loading: "Lade Ergebnis...",
    notFound: "Duell nicht gefunden",
    you: "(Du)",
    youWon: "Du hast gewonnen!",
    youLost: "Du hast verloren",
  },
  en: {
    title: "Duel Result",
    vs: "VS",
    winner: "WINNER",
    draw: "DRAW",
    points: "Points",
    time: "Sec.",
    challenger: "Challenger",
    accepter: "Accepted",
    playAgain: "Play Again",
    revanche: "Rematch",
    leaderboard: "Duel Rankings",
    backToGames: "Back to Games",
    loading: "Loading result...",
    notFound: "Duel not found",
    you: "(You)",
    youWon: "You won!",
    youLost: "You lost",
  },
  sl: {
    title: "Rezultat dvoboja",
    vs: "VS",
    winner: "ZMAGOVALEC",
    draw: "NEODLOČENO",
    points: "Točk",
    time: "Sek.",
    challenger: "Izzivalec",
    accepter: "Sprejel",
    playAgain: "Igraj znova",
    revanche: "Revanša",
    leaderboard: "Lestvica dvobojev",
    backToGames: "Nazaj na igre",
    loading: "Nalagam rezultat...",
    notFound: "Dvoboj ni najden",
    you: "(Ti)",
    youWon: "Zmagal si!",
    youLost: "Izgubil si",
  },
};

export default function DuelResultsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const locale = (params.locale as string) || "de";
  const duelId = params.duelId as string;

  const t = labels[locale as keyof typeof labels] || labels.de;

  const [duelResult, setDuelResult] = useState<DuelResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLossAnimation, setShowLossAnimation] = useState(false);
  const [showRevancheModal, setShowRevancheModal] = useState(false);

  useEffect(() => {
    const fetchDuelResult = async () => {
      try {
        const response = await fetch(`/api/ranked/duel/${duelId}`);
        if (response.ok) {
          const data = await response.json();
          setDuelResult(data);

          // Trigger confetti if current user won
          if (session?.user?.id && data.winnerId === session.user.id) {
            setTimeout(() => {
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ["#00D9FF", "#FF6B35", "#00FF88"],
              });
            }, 300);
          }

          // Trigger loss animation if current user lost
          const isParticipant = session?.user?.id === data.challengerId ||
                               session?.user?.id === data.accepterId;
          if (isParticipant && data.winnerId !== session?.user?.id) {
            setTimeout(() => setShowLossAnimation(true), 300);
          }
        }
      } catch (error) {
        console.error("Error fetching duel result:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDuelResult();
  }, [duelId, session?.user?.id]);

  const handlePlayAgain = () => {
    // Open revanche modal instead of navigating
    setShowRevancheModal(true);
  };

  // Determine opponent info (the other player in the duel)
  const getOpponentInfo = () => {
    if (!duelResult || !session?.user?.id) return { id: "", name: "" };

    const isCurrentUserChallenger = session.user.id === duelResult.challengerId;
    if (isCurrentUserChallenger) {
      return { id: duelResult.accepterId, name: duelResult.accepterName };
    } else {
      return { id: duelResult.challengerId, name: duelResult.challengerName };
    }
  };

  const opponentInfo = getOpponentInfo();

  // Background component
  const BackgroundMap = () => (
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
  );

  // Tear rain animation component for loss
  const TearRain = () => (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-tear-fall"
          style={{
            left: `${8 + i * 8}%`,
            animationDelay: `${i * 0.15}s`,
            animationDuration: `${1.5 + Math.random() * 0.5}s`,
          }}
        >
          <svg
            width="20"
            height="28"
            viewBox="0 0 20 28"
            className="drop-shadow-lg"
          >
            <path
              d="M10 0C10 0 0 14 0 20C0 24.4183 4.47715 28 10 28C15.5228 28 20 24.4183 20 20C20 14 10 0 10 0Z"
              fill={i % 2 === 0 ? "#60A5FA" : "#3B82F6"}
              fillOpacity="0.8"
            />
          </svg>
        </div>
      ))}
      <style jsx>{`
        @keyframes tear-fall {
          0% {
            transform: translateY(-30px) scale(0.8);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(100vh) scale(1);
            opacity: 0;
          }
        }
        .animate-tear-fall {
          animation: tear-fall linear infinite;
        }
      `}</style>
    </div>
  );

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <BackgroundMap />
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!duelResult) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <BackgroundMap />
        <Card variant="glass" padding="lg" className="text-center">
          <CardContent className="pt-4">
            <p className="text-text-muted">{t.notFound}</p>
            <Link href={`/${locale}/guesser`} className="mt-4 block">
              <Button variant="primary">{t.backToGames}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCurrentUserChallenger = session?.user?.id === duelResult.challengerId;
  const isCurrentUserAccepter = session?.user?.id === duelResult.accepterId;
  const isCurrentUserWinner = session?.user?.id === duelResult.winnerId;
  const isChallengerWinner = duelResult.winnerId === duelResult.challengerId;

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <BackgroundMap />

      <div className="w-full max-w-lg space-y-6 animate-fade-in">
        {/* Title */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent mb-4">
            <Swords className="w-5 h-5" />
            <span className="font-semibold">{t.title}</span>
          </div>

          {/* Winner Announcement */}
          {isCurrentUserWinner ? (
            <div className="flex items-center justify-center gap-2 text-success mb-2">
              <Crown className="w-8 h-8" />
              <span className="text-3xl font-bold">{t.youWon}</span>
            </div>
          ) : (isCurrentUserChallenger || isCurrentUserAccepter) && (
            <div className="flex flex-col items-center gap-2 mb-2">
              {showLossAnimation && <TearRain />}
              <p className="text-3xl font-bold text-red-400">{t.youLost}</p>
              {showLossAnimation && (
                <span className="text-5xl animate-bounce">😢</span>
              )}
            </div>
          )}
        </div>

        {/* VS Card */}
        <Card variant="elevated" padding="lg">
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 gap-4 items-center">
              {/* Challenger */}
              <div className={`text-center ${isChallengerWinner ? "scale-105" : "opacity-80"}`}>
                <div className="relative inline-block mb-2">
                  <Avatar
                    name={duelResult.challengerName}
                    size="xl"
                    className={isChallengerWinner ? "ring-2 ring-success ring-offset-2 ring-offset-surface-1" : ""}
                  />
                  {isChallengerWinner && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-success flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-background" />
                    </div>
                  )}
                </div>
                <p className="font-semibold text-text-primary text-sm">
                  {duelResult.challengerName}
                  {isCurrentUserChallenger && <span className="text-primary text-xs block">{t.you}</span>}
                </p>
                <p className="text-xs text-text-muted">{t.challenger}</p>

                <div className="mt-3 space-y-1">
                  <p className={`text-2xl font-bold ${isChallengerWinner ? "text-success" : "text-text-primary"}`}>
                    {duelResult.challengerScore.toLocaleString()}
                  </p>
                  <p className="text-xs text-text-muted">{t.points}</p>
                  <p className="text-lg text-primary">{duelResult.challengerTime.toFixed(1)}s</p>
                </div>
              </div>

              {/* VS */}
              <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-accent/20 flex items-center justify-center mb-2">
                  <span className="text-accent font-bold text-lg">{t.vs}</span>
                </div>
              </div>

              {/* Accepter */}
              <div className={`text-center ${!isChallengerWinner ? "scale-105" : "opacity-80"}`}>
                <div className="relative inline-block mb-2">
                  <Avatar
                    name={duelResult.accepterName}
                    size="xl"
                    className={!isChallengerWinner ? "ring-2 ring-success ring-offset-2 ring-offset-surface-1" : ""}
                  />
                  {!isChallengerWinner && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-success flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-background" />
                    </div>
                  )}
                </div>
                <p className="font-semibold text-text-primary text-sm">
                  {duelResult.accepterName}
                  {isCurrentUserAccepter && <span className="text-primary text-xs block">{t.you}</span>}
                </p>
                <p className="text-xs text-text-muted">{t.accepter}</p>

                <div className="mt-3 space-y-1">
                  <p className={`text-2xl font-bold ${!isChallengerWinner ? "text-success" : "text-text-primary"}`}>
                    {duelResult.accepterScore.toLocaleString()}
                  </p>
                  <p className="text-xs text-text-muted">{t.points}</p>
                  <p className="text-lg text-primary">{duelResult.accepterTime.toFixed(1)}s</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handlePlayAgain}
            variant="primary"
            size="lg"
            className="w-full glow-primary"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            {t.revanche}
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Link href={`/${locale}/guesser/leaderboards/duels`} className="block">
              <Button variant="outline" size="md" className="w-full">
                <BarChart3 className="w-4 h-4 mr-2" />
                {t.leaderboard}
              </Button>
            </Link>

            <Link href={`/${locale}/guesser`} className="block">
              <Button variant="ghost" size="md" className="w-full text-text-muted">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.backToGames}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Revanche Modal */}
      {duelResult && opponentInfo.id && (
        <RevancheChallengeModal
          isOpen={showRevancheModal}
          onClose={() => setShowRevancheModal(false)}
          opponentId={opponentInfo.id}
          opponentName={opponentInfo.name}
          locale={locale}
          defaultGameType={duelResult.gameType}
        />
      )}
    </div>
  );
}
