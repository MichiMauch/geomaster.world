"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Swords, History, ArrowLeft, Trophy, Clock, Target } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import GameTypeSelector from "@/components/guesser/GameTypeSelector";

interface DuelHistoryEntry {
  id: string;
  duelSeed: string;
  gameType: string;
  opponentId: string;
  opponentName: string;
  opponentImage: string | null;
  myScore: number;
  myTime: number;
  opponentScore: number;
  opponentTime: number;
  isWinner: boolean;
  myRole: "challenger" | "accepter";
  createdAt: string;
}

const labels = {
  de: {
    title: "Meine Duelle",
    subtitle: "Deine Duell-Historie auf einen Blick",
    overall: "Alle",
    filterByGameType: "Filter nach Spieltyp",
    opponent: "Gegner",
    result: "Ergebnis",
    score: "Punkte",
    time: "Zeit",
    noData: "Du hast noch keine Duelle gespielt",
    noDataFiltered: "Keine Duelle für diesen Spieltyp",
    back: "Zurück",
    loading: "Lade Duelle...",
    win: "Gewonnen",
    loss: "Verloren",
    you: "Du",
    challenger: "Herausforderer",
    accepter: "Herausgefordert",
    viewDetails: "Details",
    loadMore: "Mehr laden",
    justNow: "Gerade eben",
    minutesAgo: (n: number) => `vor ${n} Min.`,
    hoursAgo: (n: number) => `vor ${n} Std.`,
    daysAgo: (n: number) => `vor ${n} Tagen`,
  },
  en: {
    title: "My Duels",
    subtitle: "Your duel history at a glance",
    overall: "All",
    filterByGameType: "Filter by game type",
    opponent: "Opponent",
    result: "Result",
    score: "Score",
    time: "Time",
    noData: "You haven't played any duels yet",
    noDataFiltered: "No duels for this game type",
    back: "Back",
    loading: "Loading duels...",
    win: "Won",
    loss: "Lost",
    you: "You",
    challenger: "Challenger",
    accepter: "Challenged",
    viewDetails: "Details",
    loadMore: "Load more",
    justNow: "Just now",
    minutesAgo: (n: number) => `${n}m ago`,
    hoursAgo: (n: number) => `${n}h ago`,
    daysAgo: (n: number) => `${n}d ago`,
  },
  sl: {
    title: "Moji dvoboji",
    subtitle: "Tvoja zgodovina dvobojev",
    overall: "Vsi",
    filterByGameType: "Filtriraj po vrsti igre",
    opponent: "Nasprotnik",
    result: "Rezultat",
    score: "Točke",
    time: "Čas",
    noData: "Še nisi odigral nobenega dvoboja",
    noDataFiltered: "Ni dvobojev za to vrsto igre",
    back: "Nazaj",
    loading: "Nalagam dvoboje...",
    win: "Zmaga",
    loss: "Poraz",
    you: "Ti",
    challenger: "Izzivalec",
    accepter: "Izzvani",
    viewDetails: "Podrobnosti",
    loadMore: "Naloži več",
    justNow: "Pravkar",
    minutesAgo: (n: number) => `pred ${n} min`,
    hoursAgo: (n: number) => `pred ${n} urami`,
    daysAgo: (n: number) => `pred ${n} dnevi`,
  },
};

function formatTimeAgo(date: string, t: typeof labels.de): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return t.justNow;
  if (diffMinutes < 60) return t.minutesAgo(diffMinutes);
  if (diffHours < 24) return t.hoursAgo(diffHours);
  return t.daysAgo(diffDays);
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function DuelHistoryPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || "de";

  const t = labels[locale as keyof typeof labels] || labels.de;

  const [selectedGameType, setSelectedGameType] = useState<string>("overall");
  const [duels, setDuels] = useState<DuelHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const fetchDuels = async () => {
      setLoading(true);
      try {
        const gameTypeParam = selectedGameType === "overall"
          ? ""
          : `?gameType=${encodeURIComponent(selectedGameType)}`;
        const response = await fetch(`/api/ranked/duel/history${gameTypeParam}`);
        if (response.ok) {
          const data = await response.json();
          setDuels(data.duels || []);
          setHasMore(data.hasMore || false);
        }
      } catch (error) {
        console.error("Error fetching duel history:", error);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchDuels();
    }
  }, [selectedGameType, status]);

  const loadMoreDuels = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const gameTypeParam = selectedGameType === "overall"
        ? `?offset=${duels.length}`
        : `?gameType=${encodeURIComponent(selectedGameType)}&offset=${duels.length}`;
      const response = await fetch(`/api/ranked/duel/history${gameTypeParam}`);
      if (response.ok) {
        const data = await response.json();
        setDuels([...duels, ...(data.duels || [])]);
        setHasMore(data.hasMore || false);
      }
    } catch (error) {
      console.error("Error loading more duels:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Redirect if not logged in
  if (status === "unauthenticated") {
    router.push(`/${locale}/guesser`);
    return null;
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <History className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground font-heading">
              {t.title}
            </h1>
            <p className="text-text-muted">
              {t.subtitle}
            </p>
          </div>
        </div>

        <Link href={`/${locale}/guesser`}>
          <Button variant="ghost" size="sm" className="text-text-muted">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.back}
          </Button>
        </Link>
      </div>

      {/* Game Type Filter */}
      <Card variant="surface" padding="md" className="mb-6">
        <h3 className="text-md font-semibold mb-3 text-text-primary">
          {t.filterByGameType}
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedGameType("overall")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedGameType === "overall"
                ? "bg-primary text-white"
                : "bg-surface-2 text-text-secondary hover:bg-surface-3"
            }`}
          >
            {t.overall}
          </button>
        </div>
        <div className="mt-3">
          <GameTypeSelector
            selected={selectedGameType === "overall" ? null : selectedGameType}
            onChange={setSelectedGameType}
            excludeImageTypes={true}
          />
        </div>
      </Card>

      {/* Duel History */}
      <Card variant="elevated" padding="none">
        <CardHeader className="border-b border-glass-border p-4">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">{t.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-text-muted">{t.loading}</span>
            </div>
          ) : duels.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <Swords className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{selectedGameType === "overall" ? t.noData : t.noDataFiltered}</p>
            </div>
          ) : (
            <div className="divide-y divide-glass-border">
              {duels.map((duel) => (
                <Link
                  key={duel.id}
                  href={`/${locale}/guesser/duel/results/${duel.id}`}
                  className="block hover:bg-surface-2/30 transition-colors"
                >
                  <div className="p-4">
                    {/* Top Row: Result + Time */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {duel.isWinner ? (
                          <Badge variant="success" size="sm" className="flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            {t.win}
                          </Badge>
                        ) : (
                          <Badge variant="error" size="sm">
                            {t.loss}
                          </Badge>
                        )}
                        <Badge variant="default" size="sm">
                          {duel.myRole === "challenger" ? t.challenger : t.accepter}
                        </Badge>
                      </div>
                      <span className="text-xs text-text-muted">
                        {formatTimeAgo(duel.createdAt, t)}
                      </span>
                    </div>

                    {/* Main Content: You vs Opponent */}
                    <div className="flex items-center gap-4">
                      {/* Your Score */}
                      <div className="flex-1 text-center">
                        <p className="text-xs text-text-muted mb-1">{t.you}</p>
                        <div className="flex items-center justify-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <Target className="w-4 h-4 text-primary" />
                            <span className={`font-bold text-lg ${duel.isWinner ? "text-success" : "text-text-primary"}`}>
                              {duel.myScore}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-text-muted">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-sm">{formatTime(duel.myTime)}</span>
                          </div>
                        </div>
                      </div>

                      {/* VS */}
                      <div className="px-3">
                        <Swords className="w-5 h-5 text-accent" />
                      </div>

                      {/* Opponent Score */}
                      <div className="flex-1 text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Avatar
                            src={duel.opponentImage || undefined}
                            name={duel.opponentName}
                            size="sm"
                          />
                          <p className="text-xs text-text-muted truncate max-w-[80px]">
                            {duel.opponentName}
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <Target className="w-4 h-4 text-primary" />
                            <span className={`font-bold text-lg ${!duel.isWinner ? "text-success" : "text-text-primary"}`}>
                              {duel.opponentScore}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-text-muted">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-sm">{formatTime(duel.opponentTime)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Game Type */}
                    <div className="mt-3 pt-3 border-t border-glass-border/50">
                      <span className="text-xs text-text-muted">
                        {duel.gameType.replace("country:", "").replace("special:", "")}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}

              {/* Load More Button */}
              {hasMore && (
                <div className="p-4 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      loadMoreDuels();
                    }}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                    ) : null}
                    {t.loadMore}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
