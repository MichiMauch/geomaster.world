"use client";

import { cn } from "@/lib/utils";

interface QuestionDisplayProps {
  /** The question content (flag emoji, place name, or emoji combination) */
  question: string;
  /** The quiz category: "country-flags", "place-names", or "emoji-countries" */
  category: "country-flags" | "place-names" | "emoji-countries";
  /** Current locale for translations */
  locale: string;
}

/**
 * Displays the question for country quizzes
 * - For flags: Shows a large emoji flag
 * - For place names: Shows the place name with a prompt
 */
export function QuestionDisplay({ question, category, locale }: QuestionDisplayProps) {
  // Check if the question is a flag emoji (flags are usually 2+ characters with regional indicators)
  const isFlag = category === "country-flags";
  const isEmoji = category === "emoji-countries";

  // Get localized prompt
  const getPrompt = () => {
    if (isFlag) {
      switch (locale) {
        case "de":
          return "Zu welchem Land gehört diese Flagge?";
        case "sl":
          return "Kateri državi pripada ta zastava?";
        default:
          return "Which country does this flag belong to?";
      }
    } else if (isEmoji) {
      switch (locale) {
        case "de":
          return "Welches Land wird dargestellt?";
        case "sl":
          return "Katera država je prikazana?";
        default:
          return "Which country is represented?";
      }
    } else {
      switch (locale) {
        case "de":
          return "In welchem Land liegt dieser Ort?";
        case "sl":
          return "V kateri državi je ta kraj?";
        default:
          return "In which country is this place located?";
      }
    }
  };

  if (isFlag) {
    return (
      <div className="flex flex-col items-center gap-1">
        {/* Large flag emoji */}
        <span className="text-4xl sm:text-5xl leading-none">{question}</span>
        {/* Subtle prompt below */}
        <span className="text-[10px] sm:text-xs text-text-secondary font-normal">
          {getPrompt()}
        </span>
      </div>
    );
  }

  if (isEmoji) {
    return (
      <div className="flex flex-col items-center gap-1">
        {/* Large emoji combination */}
        <span className="text-3xl sm:text-4xl leading-none tracking-wider">{question}</span>
        {/* Subtle prompt below */}
        <span className="text-[10px] sm:text-xs text-text-secondary font-normal">
          {getPrompt()}
        </span>
      </div>
    );
  }

  // Place names
  return (
    <div className="flex flex-col items-center gap-1">
      {/* Place name */}
      <span className="text-base sm:text-lg font-bold text-text-primary">
        {question}
      </span>
      {/* Prompt */}
      <span className="text-[10px] sm:text-xs text-text-secondary font-normal">
        {getPrompt()}
      </span>
    </div>
  );
}

/**
 * Check if a game type is a country quiz (polygon-based scoring)
 */
export function isCountryQuizGameType(gameType: string | null | undefined): boolean {
  if (!gameType?.startsWith("world:")) return false;
  const category = gameType.split(":")[1];
  return category === "country-flags" || category === "place-names" || category === "emoji-countries";
}

/**
 * Get the country quiz category from a game type
 */
export function getCountryQuizCategory(
  gameType: string | null | undefined
): "country-flags" | "place-names" | "emoji-countries" | null {
  if (!gameType?.startsWith("world:")) return null;
  const category = gameType.split(":")[1];
  if (category === "country-flags" || category === "place-names" || category === "emoji-countries") {
    return category;
  }
  return null;
}
