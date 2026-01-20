"use client";

import { memo } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  QuestionDisplay,
  isCountryQuizGameType,
  getCountryQuizCategory,
} from "@/components/country-quiz/QuestionDisplay";
import type { GameRound, GuessResult } from "../types";

interface GameBadgeBarProps {
  currentRound: GameRound;
  locale: string;
  isPanorama: boolean;
  showResult: boolean;
  lastResult: GuessResult | null;
  timeRemaining: number;
  getTimerColor: () => string;
  buttonConfig: {
    text: string;
    variant: "success" | "primary" | "accent";
    onClick: () => void;
    disabled: boolean;
  };
  submitting: boolean;
  isDuel?: boolean;
}

function getCountryQuizResultText(lastResult: GuessResult | null, locale: string): string {
  if (!lastResult) return "";
  if (lastResult.insideCountry) {
    switch (locale) {
      case "de":
        return "Richtig!";
      case "sl":
        return "Pravilno!";
      default:
        return "Correct!";
    }
  }
  return `${lastResult.distanceKm.toFixed(0)} km`;
}

export const GameBadgeBar = memo(function GameBadgeBar({
  currentRound,
  locale,
  isPanorama,
  showResult,
  lastResult,
  timeRemaining,
  getTimerColor,
  buttonConfig,
  submitting,
  isDuel = false,
}: GameBadgeBarProps) {
  const countryQuizCategory = getCountryQuizCategory(currentRound.gameType);
  const isCountryQuiz = !!countryQuizCategory;
  const isEmojiQuiz = countryQuizCategory === "emoji-countries";

  // For country quizzes, success is based on insideCountry, not distance
  const isSuccess = isCountryQuiz
    ? lastResult?.insideCountry === true
    : lastResult && lastResult.distanceKm < 20;

  return (
    <div className={cn(
      "absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 z-[500]",
      "bg-surface-1 rounded-lg",
      "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2",
      "border-2 shadow-[0_4px_12px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.15)]",
      // Timer border colors - duel mode uses accent (orange) as base
      !showResult && timeRemaining > 10 && (isDuel ? "border-accent" : "border-primary"),
      !showResult && timeRemaining <= 10 && timeRemaining > 5 && "border-accent",
      !showResult && timeRemaining <= 5 && "border-error",
      showResult && isSuccess && "border-success",
      showResult && !isSuccess && "border-surface-3",
      // Match width with emoji overlay for emoji quiz
      isEmojiQuiz && "min-w-[380px] justify-center"
    )}>
      {/* Question/Location Display - hidden for emoji quiz (shown in separate overlay) */}
      {isEmojiQuiz ? (
        <span className="text-xl">😀</span>
      ) : isPanorama ? (
        <span className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
          <span>📷</span>
          <span>{locale === "de" ? "Wo ist das?" : locale === "sl" ? "Kje je to?" : "Where is this?"}</span>
        </span>
      ) : isCountryQuiz && countryQuizCategory ? (
        <QuestionDisplay
          question={currentRound.locationName}
          category={countryQuizCategory}
          locale={locale}
        />
      ) : (
        <span className="text-sm sm:text-base font-bold text-text-primary">
          {currentRound.locationName}
        </span>
      )}

      {/* Divider */}
      <div className="w-px h-5 bg-surface-3" />

      {/* Timer / Result */}
      <span className={cn(
        "font-mono font-bold text-sm sm:text-base tabular-nums min-w-[55px] text-center",
        showResult ? (
          isSuccess ? "text-success" :
          lastResult && lastResult.distanceKm < 100 ? "text-accent" :
          "text-text-primary"
        ) : getTimerColor()
      )}>
        {showResult && lastResult ? (
          isCountryQuiz ? (
            <>
              {getCountryQuizResultText(lastResult, locale)}
              {lastResult.score > 0 && <span className="ml-1 text-xs opacity-70">({lastResult.score} Pts)</span>}
            </>
          ) : (
            <>
              {lastResult.distanceKm.toFixed(0)} km
              <span className="ml-1 text-xs opacity-70">({lastResult.score} Pts)</span>
            </>
          )
        ) : (
          <>{timeRemaining.toFixed(2)}</>
        )}
      </span>

      {/* Divider */}
      <div className="w-px h-5 bg-surface-3" />

      {/* Action Button */}
      <Button
        variant={buttonConfig.variant}
        size="sm"
        onClick={buttonConfig.onClick}
        disabled={buttonConfig.disabled}
        isLoading={submitting}
        className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3"
      >
        {submitting ? "..." : buttonConfig.text}
      </Button>
    </div>
  );
});
