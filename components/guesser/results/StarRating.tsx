"use client";

import { useEffect, useState, useRef } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFilledStars, shouldShowConfetti } from "@/lib/game-results";
import confetti from "canvas-confetti";

interface StarRatingProps {
  score: number;
  animate?: boolean;
  className?: string;
}

// Arc positions for stars - middle star much larger and highest
const starPositions = [
  { scale: 1.0, y: 14 },   // 1st star (left outer) - smallest, lowest
  { scale: 1.2, y: 6 },    // 2nd star
  { scale: 1.6, y: 0 },    // 3rd star (center) - MUCH larger, highest
  { scale: 1.2, y: 6 },    // 4th star
  { scale: 1.0, y: 14 },   // 5th star (right outer) - smallest, lowest
];

export function StarRating({ score, animate = true, className }: StarRatingProps) {
  const filledStars = getFilledStars(score);
  const totalStars = 5;
  const [visibleStars, setVisibleStars] = useState(animate ? 0 : filledStars);
  const confettiTriggered = useRef(false);

  // Check if all 5 stars are filled (perfect score)
  const isPerfect = filledStars === 5;

  useEffect(() => {
    if (!animate) {
      setVisibleStars(filledStars);
      return;
    }

    // Reset when score changes
    setVisibleStars(0);
    confettiTriggered.current = false;

    // Animate stars appearing one by one
    const timers: NodeJS.Timeout[] = [];
    for (let i = 1; i <= filledStars; i++) {
      const timer = setTimeout(() => {
        setVisibleStars(i);

        // Trigger confetti on last star if score qualifies
        if (i === filledStars && shouldShowConfetti(score) && !confettiTriggered.current) {
          confettiTriggered.current = true;
          triggerConfetti();
        }
      }, i * 200);
      timers.push(timer);
    }

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [score, filledStars, animate]);

  const triggerConfetti = () => {
    // Fire confetti from both sides
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ["#FFD700", "#FFA500", "#00D9FF", "#FF6B35"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ["#FFD700", "#FFA500", "#00D9FF", "#FF6B35"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  };

  return (
    <div className={cn("flex items-center justify-center gap-1 py-4", className)}>
      {Array.from({ length: totalStars }).map((_, index) => {
        const isFilled = index < visibleStars;
        const isAnimating = animate && index === visibleStars - 1 && visibleStars <= filledStars;
        const isCenter = index === 2;
        const position = starPositions[index];
        const baseSize = 32; // Base size in pixels

        return (
          <div
            key={index}
            className="relative transition-all duration-300"
            style={{
              transform: `translateY(${position.y}px)`,
            }}
          >
            {/* Special radiant glow for center star when perfect (5 stars) */}
            {isCenter && isFilled && isPerfect && (
              <div className="absolute inset-0 -z-10">
                {/* Outer glow - large and soft */}
                <div
                  className="absolute inset-0 blur-2xl bg-yellow-400/40 rounded-full animate-pulse"
                  style={{ transform: "scale(2.5)" }}
                />
                {/* Middle glow - orange tint */}
                <div
                  className="absolute inset-0 blur-xl bg-orange-400/50 rounded-full animate-pulse"
                  style={{ transform: "scale(1.8)", animationDelay: "0.5s" }}
                />
                {/* Inner glow - bright */}
                <div
                  className="absolute inset-0 blur-lg bg-yellow-300/60 rounded-full"
                  style={{ transform: "scale(1.3)" }}
                />
              </div>
            )}

            {/* Regular glow for filled stars (stronger for center) */}
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
                width: `${baseSize * position.scale}px`,
                height: `${baseSize * position.scale}px`,
              }}
            />
          </div>
        );
      })}

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
