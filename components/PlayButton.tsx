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
}

export default function PlayButton({
  groupId,
  currentRound,
  userCompletedRounds,
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
            : "border-success/30 hover:border-success/50"
        )}
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center transition-colors",
              hasPlayedAllReleasedRounds
                ? "bg-warning/20 group-hover:bg-warning/30"
                : "bg-success/20 group-hover:bg-success/30"
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
                className="w-7 h-7 text-success"
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
          <div>
            <h3
              className={cn(
                "text-h3 transition-colors",
                hasPlayedAllReleasedRounds
                  ? "text-warning group-hover:text-warning"
                  : "text-success group-hover:text-success"
              )}
            >
              {t("play")}
            </h3>
            <p className="text-body-small text-text-secondary">
              {hasPlayedAllReleasedRounds
                ? t("waitForNextRound")
                : t("playCurrentGame")}
            </p>
          </div>
        </div>
      </Card>
    </button>
  );
}
