"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Swords, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";

interface GameType {
  id: string;
  name: string;
  nameEn: string;
  nameSl: string;
  icon: string;
  locationCount?: number;
}

interface RevancheChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  opponentId: string;
  opponentName: string;
  locale: string;
  defaultGameType?: string;
}

const labels = {
  de: {
    title: "Revanche",
    subtitle: "Fordere deinen Gegner erneut heraus!",
    opponent: "Gegner",
    selectGame: "Spiel auswählen",
    countries: "Länder",
    worldQuizzes: "Welt-Quiz",
    panorama: "Panorama",
    challenge: "Herausfordern",
    loading: "Lade Spiele...",
    starting: "Starte Duell...",
    cancel: "Abbrechen",
    noGames: "Keine Spiele verfügbar",
  },
  en: {
    title: "Rematch",
    subtitle: "Challenge your opponent again!",
    opponent: "Opponent",
    selectGame: "Select Game",
    countries: "Countries",
    worldQuizzes: "World Quizzes",
    panorama: "Panorama",
    challenge: "Challenge",
    loading: "Loading games...",
    starting: "Starting duel...",
    cancel: "Cancel",
    noGames: "No games available",
  },
  sl: {
    title: "Revanša",
    subtitle: "Izzovi nasprotnika še enkrat!",
    opponent: "Nasprotnik",
    selectGame: "Izberi igro",
    countries: "Države",
    worldQuizzes: "Svetovni kvizi",
    panorama: "Panorama",
    challenge: "Izzovi",
    loading: "Nalagam igre...",
    starting: "Začenjam dvoboj...",
    cancel: "Prekliči",
    noGames: "Ni iger na voljo",
  },
};

export function RevancheChallengeModal({
  isOpen,
  onClose,
  opponentId,
  opponentName,
  locale,
  defaultGameType,
}: RevancheChallengeModalProps) {
  const router = useRouter();
  const [countries, setCountries] = useState<GameType[]>([]);
  const [worldQuizzes, setWorldQuizzes] = useState<GameType[]>([]);
  const [panoramaTypes, setPanoramaTypes] = useState<GameType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGameType, setSelectedGameType] = useState<string | null>(defaultGameType || null);
  const [isStarting, setIsStarting] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const t = labels[locale as keyof typeof labels] || labels.de;

  // Load game types
  useEffect(() => {
    if (!isOpen) return;

    const fetchGameTypes = async () => {
      setIsLoading(true);
      try {
        const [countriesRes, worldRes, panoramaRes] = await Promise.all([
          fetch("/api/countries?active=true"),
          fetch("/api/world-quiz-types?active=true"),
          fetch("/api/panorama-types?active=true"),
        ]);

        if (countriesRes.ok) {
          const data = await countriesRes.json();
          setCountries(data.filter((c: GameType) => (c.locationCount || 0) >= 5));
        }
        if (worldRes.ok) {
          const data = await worldRes.json();
          setWorldQuizzes(data.filter((w: GameType) => (w.locationCount || 0) >= 5));
        }
        if (panoramaRes.ok) {
          const data = await panoramaRes.json();
          setPanoramaTypes(data.filter((p: GameType) => (p.locationCount || 0) >= 5));
        }

        // Auto-expand the category of the default game type
        if (defaultGameType) {
          if (defaultGameType.startsWith("country:")) {
            setExpandedCategory("countries");
          } else if (defaultGameType.startsWith("world:")) {
            setExpandedCategory("world");
          } else if (defaultGameType.startsWith("panorama:")) {
            setExpandedCategory("panorama");
          }
        }
      } catch (error) {
        console.error("Error fetching game types:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGameTypes();
  }, [isOpen, defaultGameType]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleStartDuel = async () => {
    if (!selectedGameType) return;

    setIsStarting(true);
    try {
      // Create duel game with revanche opponent info
      const response = await fetch("/api/ranked/games/duel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType: selectedGameType,
          revancheOpponentId: opponentId,
          revancheOpponentName: opponentName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store revanche info in sessionStorage for use after game completion
        sessionStorage.setItem("revancheOpponentId", opponentId);
        sessionStorage.setItem("revancheOpponentName", opponentName);
        // Navigate to play page
        router.push(`/${locale}/guesser/play/${data.gameId}`);
      } else {
        console.error("Failed to create duel game");
        setIsStarting(false);
      }
    } catch (error) {
      console.error("Error starting duel:", error);
      setIsStarting(false);
    }
  };

  const getLocalizedName = (item: GameType): string => {
    if (locale === "en" && item.nameEn) return item.nameEn;
    if (locale === "sl" && item.nameSl) return item.nameSl;
    return item.name;
  };

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const renderGameList = (games: GameType[], prefix: string) => {
    return games.map((game) => {
      const gameTypeId = `${prefix}:${game.id}`;
      const isSelected = selectedGameType === gameTypeId;

      return (
        <button
          key={game.id}
          onClick={() => setSelectedGameType(gameTypeId)}
          className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
            isSelected
              ? "bg-primary/20 border-l-2 border-primary"
              : "hover:bg-surface-2/50"
          }`}
        >
          <span className="text-xl">{game.icon}</span>
          <span className={`flex-1 text-sm ${isSelected ? "text-primary font-medium" : "text-text-primary"}`}>
            {getLocalizedName(game)}
          </span>
          {game.locationCount && (
            <span className="text-xs text-text-muted">{game.locationCount}</span>
          )}
        </button>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-white/10 animate-fade-in max-h-[90vh] flex flex-col"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(12px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-glass-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <Swords className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-semibold text-text-primary">
                {t.title}
              </h2>
              <p className="text-sm text-text-muted">{t.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-2 transition-colors text-text-muted hover:text-text-primary"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Opponent Info */}
        <div className="p-4 border-b border-glass-border shrink-0">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2">{t.opponent}</p>
          <div className="flex items-center gap-3">
            <Avatar name={opponentName} size="lg" />
            <span className="text-lg font-semibold text-text-primary">{opponentName}</span>
          </div>
        </div>

        {/* Game Selection */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-primary animate-spin mr-2" />
              <span className="text-text-muted">{t.loading}</span>
            </div>
          ) : (
            <div className="divide-y divide-glass-border">
              {/* Countries Category */}
              {countries.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleCategory("countries")}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-2/30 transition-colors"
                  >
                    <span className="font-medium text-text-primary">{t.countries}</span>
                    <ChevronRight
                      className={`w-5 h-5 text-text-muted transition-transform ${
                        expandedCategory === "countries" ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                  {expandedCategory === "countries" && (
                    <div className="bg-surface-1/30">
                      {renderGameList(countries, "country")}
                    </div>
                  )}
                </div>
              )}

              {/* World Quizzes Category */}
              {worldQuizzes.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleCategory("world")}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-2/30 transition-colors"
                  >
                    <span className="font-medium text-text-primary">{t.worldQuizzes}</span>
                    <ChevronRight
                      className={`w-5 h-5 text-text-muted transition-transform ${
                        expandedCategory === "world" ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                  {expandedCategory === "world" && (
                    <div className="bg-surface-1/30">
                      {renderGameList(worldQuizzes, "world")}
                    </div>
                  )}
                </div>
              )}

              {/* Panorama Category */}
              {panoramaTypes.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleCategory("panorama")}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-2/30 transition-colors"
                  >
                    <span className="font-medium text-text-primary">{t.panorama}</span>
                    <ChevronRight
                      className={`w-5 h-5 text-text-muted transition-transform ${
                        expandedCategory === "panorama" ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                  {expandedCategory === "panorama" && (
                    <div className="bg-surface-1/30">
                      {renderGameList(panoramaTypes, "panorama")}
                    </div>
                  )}
                </div>
              )}

              {/* No games message */}
              {countries.length === 0 && worldQuizzes.length === 0 && panoramaTypes.length === 0 && (
                <div className="p-8 text-center text-text-muted">
                  {t.noGames}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-glass-border space-y-3 shrink-0">
          <Button
            onClick={handleStartDuel}
            variant="accent"
            size="lg"
            className="w-full glow-accent"
            disabled={!selectedGameType || isStarting}
            isLoading={isStarting}
          >
            {isStarting ? (
              t.starting
            ) : (
              <>
                <Swords className="w-4 h-4 mr-2" />
                {t.challenge}
              </>
            )}
          </Button>

          <Button
            onClick={onClose}
            variant="ghost"
            size="md"
            className="w-full text-text-muted"
            disabled={isStarting}
          >
            {t.cancel}
          </Button>
        </div>
      </div>
    </div>
  );
}
