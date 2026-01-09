"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SummaryMap } from "@/components/Map";
import { formatDistance } from "@/lib/distance";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import type { GameRound, Guess, Game } from "../types";

interface RoundSummaryProps {
  locale: string;
  groupId: string;
  game: Game;
  releasedRounds: GameRound[];
  userGuesses: Guess[];
  currentRound: GameRound | undefined;
}

export function RoundSummary({
  locale,
  groupId,
  game,
  releasedRounds,
  userGuesses,
  currentRound,
}: RoundSummaryProps) {
  const t = useTranslations("play");

  const completedRoundNumber = game.currentRound;
  const currentRoundLocations = releasedRounds.filter(
    (r) => r.roundNumber === completedRoundNumber
  );
  const currentRoundGuesses = userGuesses.filter((g) =>
    currentRoundLocations.some((loc) => loc.id === g.gameRoundId)
  );
  const currentRoundDistance = currentRoundGuesses.reduce(
    (sum, g) => sum + g.distanceKm,
    0
  );
  const currentRoundScore = currentRoundGuesses.reduce(
    (sum, g) => sum + g.score,
    0
  );

  // Prepare marker data for SummaryMap
  const summaryMarkers = currentRoundGuesses.map((guess) => {
    const location = currentRoundLocations.find((r) => r.id === guess.gameRoundId);
    return {
      guess: guess.latitude != null && guess.longitude != null
        ? { lat: guess.latitude, lng: guess.longitude }
        : null,
      target: {
        lat: location?.latitude ?? 0,
        lng: location?.longitude ?? 0,
        name: location?.locationName ?? "",
      },
      distanceKm: guess.distanceKm,
    };
  });

  const roundCountry = currentRoundLocations[0]?.country ?? game?.country ?? DEFAULT_COUNTRY;
  const roundGameType = currentRoundLocations[0]?.gameType;

  return (
    <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      {/* Summary Map */}
      <Card variant="elevated" padding="md">
        <SummaryMap markers={summaryMarkers} height="300px" gameType={roundGameType ?? undefined} country={roundCountry} />
      </Card>

      {/* Results Card */}
      <Card variant="elevated" padding="lg" className="text-center space-y-4">
        <div className="space-y-1">
          <span className="text-3xl">🎉</span>
          <h2 className="text-h2 text-text-primary">
            {t("roundComplete", { number: completedRoundNumber })}
          </h2>
        </div>

        <div className="py-3 rounded-lg bg-surface-2">
          <p className="text-xs text-text-muted mb-1">Gesamtpunktzahl</p>
          <p className="text-3xl font-bold text-accent tabular-nums">
            {currentRoundScore} Pkt
          </p>
          <p className="text-body text-text-muted mt-1 tabular-nums">
            {formatDistance(currentRoundDistance, currentRound?.gameType)} Distanz
          </p>
        </div>

        <div className="space-y-1">
          {currentRoundGuesses.map((guess) => {
            const location = currentRoundLocations.find(
              (r) => r.id === guess.gameRoundId
            );
            return (
              <div
                key={guess.gameRoundId}
                className="flex justify-between items-center p-2 rounded-lg bg-surface-2"
              >
                <span className="text-text-secondary">{location?.locationName}</span>
                <div className="text-right">
                  <span
                    className={cn(
                      "font-medium tabular-nums",
                      guess.score >= 80
                        ? "text-success"
                        : guess.score >= 50
                        ? "text-accent"
                        : "text-error"
                    )}
                  >
                    {guess.score} Pkt
                  </span>
                  <span className="text-caption text-text-muted ml-2 tabular-nums">
                    ({formatDistance(guess.distanceKm, currentRound?.gameType)})
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <Link href={`/${locale}/groups/${groupId}`}>
          <Button variant="primary" size="md" fullWidth>
            {t("toLeaderboard")}
          </Button>
        </Link>
      </Card>
    </main>
  );
}
