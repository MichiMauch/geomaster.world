"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import {
  Trophy,
  Crown,
  Swords,
  ArrowLeft,
  Share2,
  Eye,
} from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { StarRating, RoundReview } from "@/components/guesser/results";
import { ShareResultModal } from "@/components/guesser/ShareResultModal";

interface DuelResult {
  id: string;
  duelSeed: string;
  gameType: string;
  gameTypeName?: string | { [locale: string]: string };
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
  gameId?: string;
}

const labels = {
  de: {
    title: "Duell beendet!",
    vs: "VS",
    winner: "SIEGER",
    draw: "UNENTSCHIEDEN",
    points: "Punkte",
    time: "Sek.",
    challenger: "Herausforderer",
    accepter: "Angenommen",
    challenge: "Revanche",
    share: "Teilen",
    viewAnswers: "Antworten",
    backToGames: "Zurück zur Spielübersicht",
    loading: "Lade Ergebnis...",
    notFound: "Duell nicht gefunden",
    you: "(Du)",
    youWon: "Du hast gewonnen!",
    youLost: "Du hast leider verloren",
    creating: "Erstelle...",
  },
  en: {
    title: "Duel finished!",
    vs: "VS",
    winner: "WINNER",
    draw: "DRAW",
    points: "Points",
    time: "Sec.",
    challenger: "Challenger",
    accepter: "Accepted",
    challenge: "Rematch",
    share: "Share",
    viewAnswers: "Answers",
    backToGames: "Back to Games",
    loading: "Loading result...",
    notFound: "Duel not found",
    you: "(You)",
    youWon: "You won!",
    youLost: "You lost",
    creating: "Creating...",
  },
  sl: {
    title: "Dvoboj končan!",
    vs: "VS",
    winner: "ZMAGOVALEC",
    draw: "NEODLOČENO",
    points: "Točk",
    time: "Sek.",
    challenger: "Izzivalec",
    accepter: "Sprejel",
    challenge: "Revanša",
    share: "Deli",
    viewAnswers: "Odgovori",
    backToGames: "Nazaj na igre",
    loading: "Nalagam rezultat...",
    notFound: "Dvoboj ni najden",
    you: "(Ti)",
    youWon: "Zmagal si!",
    youLost: "Izgubil si",
    creating: "Ustvarjam...",
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

  // Challenge and share modal states
  const [showShareResultModal, setShowShareResultModal] = useState(false);
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);

  // Round review state
  const [showRoundReview, setShowRoundReview] = useState(false);

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
                colors: ["#FF6B35", "#FF8F66", "#00FF88"],
              });
            }, 300);
          }

          // Trigger loss animation if current user lost
          const isParticipant =
            session?.user?.id === data.challengerId ||
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

  // Get current user's score for star rating
  const getCurrentUserScore = (): number => {
    if (!duelResult || !session?.user?.id) return 0;
    if (session.user.id === duelResult.challengerId) {
      return duelResult.challengerScore;
    }
    if (session.user.id === duelResult.accepterId) {
      return duelResult.accepterScore;
    }
    // Default to winner's score if not a participant
    return Math.max(duelResult.challengerScore, duelResult.accepterScore);
  };

  // Get localized game type name
  const getLocalizedGameTypeName = (): string => {
    if (!duelResult) return "";
    const name = duelResult.gameTypeName;
    if (typeof name === "object" && name !== null) {
      return name[locale] || name.en || duelResult.gameType;
    }
    return (name as string) || duelResult.gameType;
  };

  // Handle "Herausfordern" button - creates a new duel and redirects to play
  const handleChallenge = async () => {
    if (!duelResult) return;

    setIsCreatingChallenge(true);
    try {
      const response = await fetch("/api/ranked/games/duel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameType: duelResult.gameType }),
      });

      if (response.ok) {
        const data = await response.json();
        // Navigate to play the new duel - after completion, share modal will be shown
        router.push(`/${locale}/guesser/play/${data.gameId}`);
      }
    } catch (error) {
      console.error("Error creating duel:", error);
      setIsCreatingChallenge(false);
    }
  };

  // Background component with orange tint for duel atmosphere
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
      {/* Orange overlay for duel atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-t from-accent/5 via-accent/10 to-accent/5" />
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
          <svg width="20" height="28" viewBox="0 0 20 28" className="drop-shadow-lg">
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
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!duelResult) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <BackgroundMap />
        <div className="rounded-2xl border border-white/10 p-8 text-center bg-surface-1">
          <p className="text-text-muted">{t.notFound}</p>
          <Link href={`/${locale}/guesser`} className="mt-4 block">
            <Button variant="accent">{t.backToGames}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isCurrentUserChallenger = session?.user?.id === duelResult.challengerId;
  const isCurrentUserAccepter = session?.user?.id === duelResult.accepterId;
  const isCurrentUserWinner = session?.user?.id === duelResult.winnerId;
  const isChallengerWinner = duelResult.winnerId === duelResult.challengerId;

  // Get the game ID for the current user (for round review)
  const getCurrentUserGameId = (): string => {
    // Use the duel's associated game ID if available
    return duelResult.gameId || duelId;
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <BackgroundMap />

      <div className="w-full max-w-md space-y-4 animate-fade-in">
        {/* Main Card */}
        <div
          className="rounded-2xl border border-white/10 p-6 text-center bg-surface-1"
        >
          {/* Title with orange gradient */}
          <div className="mb-2">
            <h1 className="text-2xl font-heading font-bold bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">
              {t.title}
            </h1>
          </div>

          {/* Winner/Loser Announcement */}
          {isCurrentUserWinner ? (
            <div className="flex items-center justify-center gap-2 text-success mb-2">
              <Crown className="w-6 h-6" />
              <span className="text-xl font-bold">{t.youWon}</span>
            </div>
          ) : (
            (isCurrentUserChallenger || isCurrentUserAccepter) && (
              <div className="flex flex-col items-center gap-1 mb-2">
                {showLossAnimation && <TearRain />}
                <p className="text-xl font-bold text-red-400">{t.youLost}</p>
              </div>
            )
          )}

          {/* Star Rating based on user's score - only show when won */}
          {isCurrentUserWinner && (
            <div className="py-2">
              <StarRating score={getCurrentUserScore()} />
            </div>
          )}

          {/* Compact VS Display */}
          <div className="flex items-center justify-center gap-4 py-4">
            {/* Challenger */}
            <div
              className={`flex flex-col items-center ${
                isChallengerWinner ? "scale-105" : "opacity-70"
              }`}
            >
              <div className="relative mb-2">
                <Avatar
                  name={duelResult.challengerName}
                  size="lg"
                  className={
                    isChallengerWinner
                      ? "ring-2 ring-success ring-offset-2 ring-offset-transparent"
                      : ""
                  }
                />
                {isChallengerWinner && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-success flex items-center justify-center">
                    <Trophy className="w-3 h-3 text-background" />
                  </div>
                )}
              </div>
              <p className="font-semibold text-text-primary text-sm">
                {duelResult.challengerName}
              </p>
              {isCurrentUserChallenger && (
                <span className="text-accent text-xs">{t.you}</span>
              )}
              <p
                className={`text-xl font-bold mt-1 ${
                  isChallengerWinner ? "text-success" : "text-text-primary"
                }`}
              >
                {duelResult.challengerScore.toLocaleString()}
              </p>
            </div>

            {/* VS Badge */}
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <Swords className="w-5 h-5 text-accent" />
            </div>

            {/* Accepter */}
            <div
              className={`flex flex-col items-center ${
                !isChallengerWinner ? "scale-105" : "opacity-70"
              }`}
            >
              <div className="relative mb-2">
                <Avatar
                  name={duelResult.accepterName}
                  size="lg"
                  className={
                    !isChallengerWinner
                      ? "ring-2 ring-success ring-offset-2 ring-offset-transparent"
                      : ""
                  }
                />
                {!isChallengerWinner && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-success flex items-center justify-center">
                    <Trophy className="w-3 h-3 text-background" />
                  </div>
                )}
              </div>
              <p className="font-semibold text-text-primary text-sm">
                {duelResult.accepterName}
              </p>
              {isCurrentUserAccepter && (
                <span className="text-accent text-xs">{t.you}</span>
              )}
              <p
                className={`text-xl font-bold mt-1 ${
                  !isChallengerWinner ? "text-success" : "text-text-primary"
                }`}
              >
                {duelResult.accepterScore.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Primary Action - Rematch Button */}
          <Button
            onClick={handleChallenge}
            variant="accent"
            size="lg"
            className="w-full glow-accent mb-4"
            isLoading={isCreatingChallenge}
            disabled={isCreatingChallenge}
          >
            <Swords className="w-4 h-4 mr-2" />
            {isCreatingChallenge ? t.creating : t.challenge}
          </Button>

          {/* Secondary Actions - Share and Answers */}
          <div className="flex gap-2 mb-4">
            <Button
              onClick={() => setShowShareResultModal(true)}
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
              {t.viewAnswers}
            </Button>
          </div>

          {/* Back to Game Selection */}
          <Link href={`/${locale}/guesser`} className="w-full block">
            <Button
              variant="ghost"
              size="md"
              className="w-full text-text-muted hover:text-text-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.backToGames}
            </Button>
          </Link>
        </div>
      </div>

      {/* Round Review Modal */}
      <RoundReview
        gameId={getCurrentUserGameId()}
        isOpen={showRoundReview}
        onClose={() => setShowRoundReview(false)}
      />

      {/* Share Result Modal */}
      {duelResult && (
        <ShareResultModal
          isOpen={showShareResultModal}
          onClose={() => setShowShareResultModal(false)}
          locale={locale}
          gameType={duelResult.gameType}
          gameTypeName={getLocalizedGameTypeName()}
          score={getCurrentUserScore()}
        />
      )}
    </div>
  );
}
