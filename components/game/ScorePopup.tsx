"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useEffect, useState } from "react";

interface ScorePopupProps {
  /** Is the popup open */
  isOpen: boolean;
  /** Distance in km */
  distance: number;
  /** Whether it's a timeout result */
  isTimeout?: boolean;
  /** Penalty text (optional) */
  penaltyText?: string;
  /** Button text */
  buttonText: string;
  /** Click handler for button */
  onContinue: () => void;
  /** Additional className */
  className?: string;
}

export function ScorePopup({
  isOpen,
  distance,
  isTimeout = false,
  penaltyText,
  buttonText,
  onContinue,
  className,
}: ScorePopupProps) {
  const [showScore, setShowScore] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Delay score animation
      const timer = setTimeout(() => setShowScore(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowScore(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getScoreColor = () => {
    if (isTimeout) return "text-error";
    if (distance < 50) return "text-success";
    if (distance < 150) return "text-accent";
    return "text-text-primary";
  };

  const getScoreEmoji = () => {
    if (isTimeout) return "⏱️";
    if (distance < 10) return "🎯";
    if (distance < 50) return "🔥";
    if (distance < 100) return "👍";
    if (distance < 200) return "😅";
    return "🗺️";
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-end sm:items-center justify-center",
        "bg-background/80 backdrop-blur-sm animate-fade-in",
        className
      )}
    >
      <Card
        variant="elevated"
        padding="xl"
        className="w-full max-w-md mx-4 mb-4 sm:mb-0 animate-slide-up space-y-6"
      >
        {/* Score Display */}
        <div className="text-center">
          {isTimeout && (
            <p className="text-body text-error mb-2 animate-shake">
              Zeit abgelaufen!
            </p>
          )}

          <div
            className={cn(
              "inline-flex items-center gap-3",
              showScore && "animate-score-pop"
            )}
          >
            <span className="text-4xl">{getScoreEmoji()}</span>
            <span
              className={cn(
                "text-display font-bold tabular-nums",
                getScoreColor()
              )}
            >
              {distance.toFixed(0)}
            </span>
            <span className="text-h2 text-text-secondary">km</span>
          </div>

          {penaltyText && (
            <p className="text-body-small text-error mt-2">{penaltyText}</p>
          )}
        </div>

        {/* Distance Rating */}
        <div className="flex justify-center">
          <DistanceRating distance={distance} isTimeout={isTimeout} />
        </div>

        {/* Continue Button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onContinue}
          className="mt-4"
        >
          {buttonText}
        </Button>
      </Card>
    </div>
  );
}

// Distance Rating Component
function DistanceRating({
  distance,
  isTimeout,
}: {
  distance: number;
  isTimeout: boolean;
}) {
  if (isTimeout) {
    return (
      <span className="text-body-small text-text-muted">
        400 km Strafe
      </span>
    );
  }

  const getRating = () => {
    if (distance < 10) return { text: "Perfekt!", color: "text-success" };
    if (distance < 50) return { text: "Ausgezeichnet!", color: "text-success" };
    if (distance < 100) return { text: "Sehr gut!", color: "text-accent" };
    if (distance < 200) return { text: "Gut!", color: "text-accent" };
    if (distance < 400) return { text: "Nicht schlecht", color: "text-text-secondary" };
    return { text: "Weit daneben", color: "text-text-muted" };
  };

  const rating = getRating();

  return <span className={cn("text-body-small", rating.color)}>{rating.text}</span>;
}

// Round Complete Popup (shown after all locations in a round)
interface RoundCompletePopupProps {
  isOpen: boolean;
  roundNumber: number;
  totalDistance: number;
  onToLeaderboard: () => void;
  onToGroup: () => void;
  leaderboardText?: string;
  groupText?: string;
}

export function RoundCompletePopup({
  isOpen,
  roundNumber,
  totalDistance,
  onToLeaderboard,
  onToGroup,
  leaderboardText = "Zur Rangliste",
  groupText = "Zurück zur Gruppe",
}: RoundCompletePopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <Card
        variant="elevated"
        padding="xl"
        className="w-full max-w-md mx-4 animate-slide-up space-y-6 text-center"
      >
        {/* Celebration */}
        <div className="space-y-2">
          <span className="text-5xl">🎉</span>
          <h2 className="text-h1 text-text-primary">
            Runde {roundNumber} beendet!
          </h2>
        </div>

        {/* Total Score */}
        <div className="py-4 rounded-xl bg-surface-2">
          <p className="text-caption text-text-muted mb-1">Gesamtdistanz</p>
          <p className="text-display font-bold text-accent tabular-nums">
            {totalDistance.toFixed(0)} km
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button variant="primary" size="lg" fullWidth onClick={onToLeaderboard}>
            {leaderboardText}
          </Button>
          <Button variant="ghost" size="md" onClick={onToGroup}>
            {groupText}
          </Button>
        </div>
      </Card>
    </div>
  );
}
