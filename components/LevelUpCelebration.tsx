"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface LevelUpCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: number;
  newLevelName: string;
  locale?: string;
}

const translations = {
  de: {
    levelUp: "Level Up!",
    youReached: "Du hast erreicht",
    continue: "Weiter",
  },
  en: {
    levelUp: "Level Up!",
    youReached: "You reached",
    continue: "Continue",
  },
  sl: {
    levelUp: "Nova raven!",
    youReached: "Dosegel si",
    continue: "Nadaljuj",
  },
};

// Arc positions for stars - middle star much larger and highest
const starPositions = [
  { scale: 1.0, y: 14 },   // 1st star (left outer) - smallest, lowest
  { scale: 1.2, y: 6 },    // 2nd star
  { scale: 1.6, y: 0 },    // 3rd star (center) - MUCH larger, highest
  { scale: 1.2, y: 6 },    // 4th star
  { scale: 1.0, y: 14 },   // 5th star (right outer) - smallest, lowest
];

export function LevelUpCelebration({
  isOpen,
  onClose,
  newLevel,
  newLevelName,
  locale = "en",
}: LevelUpCelebrationProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [visibleStars, setVisibleStars] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const t = translations[locale as keyof typeof translations] || translations.en;

  // Handle close with fade-out animation
  const handleClose = () => {
    if (isClosing) return; // Already closing
    setIsClosing(true);
    // Wait for fade-out animation (500ms), then call onClose
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 500);
  };

  // Handle render state for fade-out animation
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender && !isClosing) {
      // isOpen changed from true to false - start fade-out
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsClosing(false);
        setShouldRender(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender, isClosing]);

  // Handle animation when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Reset when closed
      setIsAnimating(false);
      setVisibleStars(0);
      return;
    }

    // Already animating, don't restart
    if (isAnimating) return;

    setIsAnimating(true);

    // Animate stars appearing one by one
    const starTimers: NodeJS.Timeout[] = [];
    for (let i = 1; i <= 5; i++) {
      const timer = setTimeout(() => {
        setVisibleStars(i);
      }, i * 200);
      starTimers.push(timer);
    }

    // Fire confetti from both sides
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      // Fire from left
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#FFD700", "#FFA500", "#00D9FF", "#FF6B35"],
      });

      // Fire from right
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#FFD700", "#FFA500", "#00D9FF", "#FF6B35"],
      });
    }, 250);

    // Initial big burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#FFD700", "#FFA500", "#00D9FF", "#FF6B35"],
      zIndex: 9999,
    });

    return () => {
      clearInterval(interval);
      starTimers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!shouldRender) return null;

  const baseStarSize = 32;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9998] flex items-center justify-center p-4",
        "transition-opacity duration-500 ease-out",
        isClosing ? "opacity-0" : "opacity-100"
      )}
    >
      {/* Backdrop for click-to-close - semi-transparent overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal Card - Same style as game results */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 p-6 sm:p-8 text-center animate-score-pop"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.08)", backdropFilter: "blur(8px)" }}
      >
        {/* 1. Title ("Level Up!") with gradient */}
        <h1 className={cn(
          "text-3xl sm:text-4xl font-heading font-bold",
          "bg-gradient-to-r from-[#00D9FF] via-[#00E5FF] to-[#FFD700] bg-clip-text text-transparent",
          "drop-shadow-[0_0_20px_rgba(0,217,255,0.4)]"
        )}>
          {t.levelUp}
        </h1>

        {/* 2. Stars in arc - centered */}
        <div style={{ paddingTop: "24px", paddingBottom: "24px" }}>
          <div className="flex items-center justify-center gap-1 py-4">
            {Array.from({ length: 5 }).map((_, index) => {
              const isFilled = index < visibleStars;
              const isAnimating = index === visibleStars - 1;
              const isCenter = index === 2;
              const position = starPositions[index];
              const isPerfect = visibleStars === 5;

              return (
                <div
                  key={index}
                  className="relative transition-all duration-300"
                  style={{
                    transform: `translateY(${position.y}px)`,
                  }}
                >
                  {/* Special radiant glow for center star when all 5 visible */}
                  {isCenter && isFilled && isPerfect && (
                    <div className="absolute inset-0 -z-10">
                      <div
                        className="absolute inset-0 blur-2xl bg-yellow-400/40 rounded-full animate-pulse"
                        style={{ transform: "scale(2.5)" }}
                      />
                      <div
                        className="absolute inset-0 blur-xl bg-orange-400/50 rounded-full animate-pulse"
                        style={{ transform: "scale(1.8)", animationDelay: "0.5s" }}
                      />
                      <div
                        className="absolute inset-0 blur-lg bg-yellow-300/60 rounded-full"
                        style={{ transform: "scale(1.3)" }}
                      />
                    </div>
                  )}

                  {/* Regular glow for filled stars */}
                  {isFilled && !(isCenter && isPerfect) && (
                    <div
                      className={cn(
                        "absolute inset-0 rounded-full -z-10",
                        isCenter
                          ? "blur-lg bg-yellow-400/50"
                          : "blur-md bg-yellow-400/40"
                      )}
                      style={{
                        transform: isCenter ? "scale(1.2)" : "scale(0.8)",
                      }}
                    />
                  )}

                  <Star
                    className={cn(
                      "transition-all duration-300",
                      isFilled
                        ? cn(
                            "fill-yellow-400 text-yellow-400 animate-[pulse-star_2s_ease-in-out_infinite]",
                            isCenter
                              ? "drop-shadow-[0_0_20px_rgba(250,204,21,0.9)]"
                              : "drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]"
                          )
                        : "fill-transparent text-surface-3/50 stroke-[1.5]",
                      isAnimating && "animate-[star-pop_0.4s_ease-out]"
                    )}
                    style={{
                      width: `${baseStarSize * position.scale}px`,
                      height: `${baseStarSize * position.scale}px`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. "You reached" text */}
        <p className="text-text-secondary mb-2">{t.youReached}</p>

        {/* 4. Level Number - large with gradient */}
        <div className="relative mb-2">
          <span
            className={cn(
              "text-6xl sm:text-7xl md:text-8xl font-heading font-bold tabular-nums",
              "bg-gradient-to-b from-[#5CE6FF] via-[#00D9FF] to-[#0066CC] bg-clip-text text-transparent",
              "drop-shadow-[0_0_40px_rgba(0,217,255,0.6)]"
            )}
          >
            {newLevel}
          </span>
        </div>

        {/* 5. Level Name with gradient */}
        <p className={cn(
          "text-xl sm:text-2xl font-semibold mb-6",
          "bg-gradient-to-r from-[#FFD700] via-[#FFAA00] to-[#00D9FF] bg-clip-text text-transparent",
          "drop-shadow-[0_0_15px_rgba(255,215,0,0.4)]"
        )}>
          {newLevelName}
        </p>

        {/* Continue button */}
        <Button variant="primary" size="lg" onClick={handleClose} className="w-full glow-primary">
          {t.continue}
        </Button>
      </div>

      {/* Star animations */}
      <style jsx global>{`
        @keyframes star-pop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.3);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes pulse-star {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  );
}
