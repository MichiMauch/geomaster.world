"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

interface EmojiQuestionOverlayProps {
  /** The emoji combination (e.g., "🥐🍷🗼") */
  question: string;
  /** Current locale for translations */
  locale: string;
  /** Whether to hide the overlay (after guess) */
  hidden?: boolean;
}

/**
 * Prominent overlay displaying emoji combination for emoji-countries quiz
 * Positioned below the GameBadgeBar with large emojis
 * Styled to match GameBadgeBar (solid surface, border, shadow)
 */
export const EmojiQuestionOverlay = memo(function EmojiQuestionOverlay({
  question,
  locale,
  hidden = false,
}: EmojiQuestionOverlayProps) {
  if (hidden) return null;

  const getPrompt = () => {
    switch (locale) {
      case "de":
        return "Welches Land wird dargestellt?";
      case "sl":
        return "Katera država je prikazana?";
      default:
        return "Which country is represented?";
    }
  };

  return (
    <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-[400] animate-fade-in">
      <div className={cn(
        "bg-surface-1 rounded-lg",
        "px-6 py-4",
        "border-2 border-primary",
        "shadow-[0_4px_12px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.15)]",
        "text-center",
        "w-[380px]"
      )}>
        {/* Large emoji display */}
        <div className="text-5xl sm:text-6xl md:text-7xl tracking-widest mb-3">
          {question}
        </div>
        {/* Question prompt */}
        <p className="text-sm sm:text-base text-text-secondary">
          {getPrompt()}
        </p>
      </div>
    </div>
  );
});
