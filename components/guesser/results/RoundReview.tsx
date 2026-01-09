"use client";

import { useState, useEffect } from "react";
import { X, Check, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatDistance } from "@/lib/distance";
import { getScoreRating } from "@/lib/score";

interface Guess {
  id: string;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number;
  score: number;
  roundNumber: number;
  locationName: string;
  gameType: string | null;
}

interface RoundReviewProps {
  gameId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RoundReview({ gameId, isOpen, onClose }: RoundReviewProps) {
  const t = useTranslations("results");
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchGuesses() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/guesses?gameId=${gameId}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to fetch guesses");
        }
        const data = await response.json();
        setGuesses(data.guesses);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch guesses");
      } finally {
        setLoading(false);
      }
    }

    fetchGuesses();
  }, [gameId, isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Consider a guess "good" if score >= 70
  const isGoodGuess = (score: number) => score >= 70;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-1 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden border border-glass-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-glass-border">
          <h2 className="text-lg font-heading font-semibold text-text-primary">
            {t("yourAnswers", { defaultValue: "Deine Antworten" })}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-2 transition-colors text-text-muted hover:text-text-primary"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-70px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <p className="text-error text-center py-8">{error}</p>
          ) : guesses.length === 0 ? (
            <p className="text-text-muted text-center py-8">
              {t("noGuesses", { defaultValue: "Keine Antworten gefunden" })}
            </p>
          ) : (
            <div className="space-y-3">
              {guesses.map((guess, index) => {
                const rating = getScoreRating(guess.score);
                const isGood = isGoodGuess(guess.score);
                const wasTimeout = guess.latitude === null;

                return (
                  <div
                    key={guess.id}
                    className={cn(
                      "p-3 rounded-xl border transition-colors",
                      isGood
                        ? "bg-success/5 border-success/20"
                        : "bg-surface-2 border-glass-border"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Status icon */}
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                          isGood ? "bg-success/20" : "bg-surface-3"
                        )}
                      >
                        {isGood ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <MapPin className="w-4 h-4 text-text-muted" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-text-muted text-sm">{index + 1}.</span>
                          <span className="font-medium text-text-primary truncate">
                            {guess.locationName}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm text-text-muted">
                            {wasTimeout
                              ? t("timeout", { defaultValue: "Timeout" })
                              : formatDistance(guess.distanceKm, guess.gameType)}
                          </span>
                          <span className={cn("font-semibold tabular-nums", rating.color)}>
                            {guess.score} {t("points", { defaultValue: "Punkte" })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
