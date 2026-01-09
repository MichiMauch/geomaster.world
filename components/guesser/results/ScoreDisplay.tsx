"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { getTitle, getRank, getFilledStars } from "@/lib/game-results";
import { useTranslations } from "next-intl";

interface ScoreDisplayProps {
  score: number;
  isNewHighscore?: boolean;
  pointsToHighscore?: number;
  animate?: boolean;
  className?: string;
  /** If true, renders only the title */
  titleOnly?: boolean;
  /** If true, renders only the rank */
  rankOnly?: boolean;
  /** If true, renders only the score number */
  scoreOnly?: boolean;
  /** If true, renders only the highscore badge */
  highscoreOnly?: boolean;
}

export function ScoreDisplay({
  score,
  isNewHighscore = false,
  pointsToHighscore = 0,
  animate = true,
  className,
  titleOnly = false,
  rankOnly = false,
  scoreOnly = false,
  highscoreOnly = false,
}: ScoreDisplayProps) {
  const t = useTranslations("results");
  const [displayScore, setDisplayScore] = useState(animate ? 0 : score);
  const [showHighscore, setShowHighscore] = useState(!animate);
  const animationRef = useRef<number | null>(null);

  const stars = getFilledStars(score);
  const title = getTitle(stars);
  const rank = getRank(score);

  useEffect(() => {
    if (!animate) {
      setDisplayScore(score);
      setShowHighscore(true);
      return;
    }

    // Reset
    setDisplayScore(0);
    setShowHighscore(false);

    // Animate score counter
    const duration = 1200; // 1.2 seconds
    const startTime = Date.now();
    const startValue = 0;
    const endValue = score;

    const animateScore = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Linear animation - steady counting
      const currentValue = Math.round(startValue + (endValue - startValue) * progress);

      setDisplayScore(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateScore);
      } else {
        // Show highscore badge after counter finishes
        setTimeout(() => setShowHighscore(true), 300);
      }
    };

    // Start animation quickly (short delay)
    const timer = setTimeout(() => {
      animationRef.current = requestAnimationFrame(animateScore);
    }, 400);

    return () => {
      clearTimeout(timer);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [score, animate]);

  // Render only specific parts if requested
  if (titleOnly) {
    return (
      <h1 className={cn(
        "text-3xl sm:text-4xl font-heading font-bold",
        "bg-gradient-to-r from-[#00D9FF] via-[#00E5FF] to-[#FFD700] bg-clip-text text-transparent",
        "drop-shadow-[0_0_20px_rgba(0,217,255,0.4)]",
        className
      )}>
        {t(title.titleKey, { defaultValue: title.text })}
      </h1>
    );
  }

  if (rankOnly) {
    return (
      <p className={cn(
        "text-xl sm:text-2xl font-semibold",
        "bg-gradient-to-r from-[#FFD700] via-[#FFAA00] to-[#00D9FF] bg-clip-text text-transparent",
        "drop-shadow-[0_0_15px_rgba(255,215,0,0.4)]",
        className
      )}>
        {t("rank", { defaultValue: "Rang" })}: {t(rank.titleKey, { defaultValue: rank.title })}
      </p>
    );
  }

  if (scoreOnly) {
    return (
      <div className={cn("relative", className)}>
        <span
          className={cn(
            "text-6xl sm:text-7xl md:text-8xl font-heading font-bold tabular-nums",
            "bg-gradient-to-b from-[#5CE6FF] via-[#00D9FF] to-[#0066CC] bg-clip-text text-transparent",
            "drop-shadow-[0_0_40px_rgba(0,217,255,0.6)]"
          )}
        >
          {displayScore}
        </span>
      </div>
    );
  }

  if (highscoreOnly) {
    return (
      <div
        className={cn(
          "h-8 transition-all duration-500",
          showHighscore ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
          className
        )}
      >
        {isNewHighscore ? (
          <p className="text-yellow-400 font-semibold animate-pulse">
            {t("newHighscore", { defaultValue: "Neuer Highscore!" })}
          </p>
        ) : pointsToHighscore > 0 ? (
          <p className="text-text-muted text-sm">
            {t("pointsToHighscore", {
              points: pointsToHighscore,
              defaultValue: `Noch ${pointsToHighscore} Punkte bis zum Highscore`,
            })}
          </p>
        ) : null}
      </div>
    );
  }

  // Default: render everything
  return (
    <div className={cn("text-center space-y-3", className)}>
      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-heading font-bold bg-gradient-to-r from-[#5CE6FF] via-[#00D9FF] to-[#5CE6FF] bg-clip-text text-transparent">
        {t(title.titleKey, { defaultValue: title.text })}
      </h1>

      {/* Rank */}
      <p className="text-lg sm:text-xl font-semibold text-yellow-400">
        {t("rank", { defaultValue: "Rang" })}: {t(rank.titleKey, { defaultValue: rank.title })}
      </p>

      {/* Score with improved gradient */}
      <div className="relative">
        <span
          className={cn(
            "text-6xl sm:text-7xl md:text-8xl font-heading font-bold tabular-nums",
            "bg-gradient-to-b from-[#5CE6FF] via-[#00D9FF] to-[#0066CC] bg-clip-text text-transparent",
            "drop-shadow-[0_0_40px_rgba(0,217,255,0.6)]"
          )}
        >
          {displayScore}
        </span>
      </div>

      {/* Highscore indicator */}
      <div
        className={cn(
          "h-8 transition-all duration-500",
          showHighscore ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}
      >
        {isNewHighscore ? (
          <p className="text-yellow-400 font-semibold animate-pulse">
            {t("newHighscore", { defaultValue: "Neuer Highscore!" })}
          </p>
        ) : pointsToHighscore > 0 ? (
          <p className="text-text-muted text-sm">
            {t("pointsToHighscore", {
              points: pointsToHighscore,
              defaultValue: `Noch ${pointsToHighscore} Punkte bis zum Highscore`,
            })}
          </p>
        ) : null}
      </div>
    </div>
  );
}
