"use client";

import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface PlayButtonProps {
  groupId: string;
  currentRound: number;
  userCompletedRounds: number;
  gameName?: string | null;
}

export default function PlayButton({
  groupId,
  currentRound,
  userCompletedRounds,
  gameName,
}: PlayButtonProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("group");

  // Check if user has played all currently released rounds
  const hasPlayedAllReleasedRounds = userCompletedRounds >= currentRound;

  const handleClick = () => {
    if (hasPlayedAllReleasedRounds) {
      toast(t("playedRoundWait", { round: currentRound }), {
        icon: "⏳",
      });
      return;
    }

    // Navigate to play page
    router.push(`/${locale}/play/${groupId}`);
  };

  return (
    <button onClick={handleClick} className="w-full text-left group">
      <Card
        variant="interactive"
        padding="lg"
        className={cn(
          "h-full transition-all duration-300",
          hasPlayedAllReleasedRounds
            ? "border-warning/30 hover:border-warning/50"
            : "bg-success border-success hover:bg-success/90"
        )}
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "w-14 h-14 rounded-lg flex items-center justify-center transition-colors",
              hasPlayedAllReleasedRounds
                ? "bg-warning/20 group-hover:bg-warning/30"
                : "bg-black/10 group-hover:bg-black/20"
            )}
          >
            {hasPlayedAllReleasedRounds ? (
              <svg
                className="w-7 h-7 text-warning"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-7 h-7 text-black"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <h3
              className={cn(
                "text-h3 transition-colors",
                hasPlayedAllReleasedRounds
                  ? "text-warning group-hover:text-warning"
                  : "text-black"
              )}
            >
              {gameName ? `${gameName} spielen` : t("play")}
            </h3>
            <p className={cn(
              "text-body-small",
              hasPlayedAllReleasedRounds ? "text-text-secondary" : "text-black/70"
            )}>
              {hasPlayedAllReleasedRounds
                ? t("waitForNextRound")
                : t("round", { number: currentRound })}
            </p>
          </div>
        </div>
      </Card>
    </button>
  );
}
