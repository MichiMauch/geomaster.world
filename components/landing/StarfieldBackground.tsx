"use client";

import { useState, useEffect } from "react";

interface Star {
  id: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  drift: number;
}

export default function StarfieldBackground() {
  const [stars, setStars] = useState<Star[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const numStars = 100 + Math.floor(Math.random() * 60);
    const generated: Star[] = [];

    for (let i = 0; i < numStars; i++) {
      generated.push({
        id: `star-${i}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1 + Math.random() * 2,
        opacity: 0.3 + Math.random() * 0.7,
        duration: 3000 + Math.random() * 4000,
        delay: Math.random() * 5000,
        drift: Math.random() * 20 - 10,
      });
    }
    setStars(generated);
  }, []);

  if (!isClient || stars.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white star-twinkle"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            animationDuration: `${star.duration}ms`,
            animationDelay: `${star.delay}ms`,
            // @ts-expect-error CSS custom property
            "--star-opacity": star.opacity,
            "--drift": `${star.drift}px`,
          }}
        />
      ))}
      <style jsx>{`
        .star-twinkle {
          animation: twinkle infinite ease-in-out;
        }
        @keyframes twinkle {
          0%, 100% {
            opacity: calc(var(--star-opacity) * 0.3);
            transform: translate(0, 0);
          }
          50% {
            opacity: var(--star-opacity);
            transform: translate(var(--drift), calc(var(--drift) * 0.5));
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .star-twinkle {
            animation: none;
            opacity: calc(var(--star-opacity) * 0.5);
          }
        }
      `}</style>
    </div>
  );
}
