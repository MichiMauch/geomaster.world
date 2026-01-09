"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { LevelBadge } from "@/components/ui/LevelBadge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

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

export function LevelUpCelebration({
  isOpen,
  onClose,
  newLevel,
  newLevelName,
  locale = "en",
}: LevelUpCelebrationProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const t = translations[locale as keyof typeof translations] || translations.en;

  useEffect(() => {
    if (isOpen && !isAnimating) {
      setIsAnimating(true);

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
          colors: ["#00D9FF", "#FF6B35", "#00FF88", "#FFFFFF"],
        });

        // Fire from right
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ["#00D9FF", "#FF6B35", "#00FF88", "#FFFFFF"],
        });
      }, 250);

      // Initial big burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#00D9FF", "#FF6B35", "#00FF88", "#FFFFFF"],
        zIndex: 9999,
      });

      return () => clearInterval(interval);
    }
  }, [isOpen, isAnimating]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative z-10 bg-surface-1 border border-glass-border rounded-2xl p-8",
          "shadow-[0_0_60px_rgba(0,217,255,0.3)]",
          "animate-score-pop text-center max-w-sm mx-4"
        )}
      >
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-xl -z-10" />

        {/* Level up text */}
        <h2 className="text-3xl font-bold text-primary mb-2 text-glow-primary">
          {t.levelUp}
        </h2>

        <p className="text-text-secondary mb-6">{t.youReached}</p>

        {/* Level badge - large */}
        <div className="flex justify-center mb-6">
          <div className="bg-surface-2 rounded-xl p-6 border border-primary/30 shadow-[0_0_20px_rgba(0,217,255,0.2)]">
            <div className="text-5xl font-bold text-primary mb-2">
              {newLevel}
            </div>
            <div className="text-xl font-semibold text-text-primary">
              {newLevelName}
            </div>
          </div>
        </div>

        {/* Continue button */}
        <Button variant="primary" size="lg" onClick={onClose} className="w-full">
          {t.continue}
        </Button>
      </div>
    </div>
  );
}
