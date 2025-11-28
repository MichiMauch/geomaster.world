"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface RoundControlPanelProps {
  gameId: string;
  groupId: string;
  currentRound: number;
  locationsPerRound: number;
  isAdmin: boolean;
  userCompletedRounds: number;
  gameStatus: "active" | "completed";
}

export default function RoundControlPanel({
  gameId,
  groupId,
  currentRound,
  locationsPerRound,
  isAdmin,
  userCompletedRounds,
  gameStatus,
}: RoundControlPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("game");
  const tCommon = useTranslations("common");
  const tOrdinals = useTranslations("ordinals");

  const handleReleaseRound = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/games/release-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("errorReleasing"));
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("unknownError"));
    } finally {
      setLoading(false);
    }
  };

  const completeGame = async () => {
    setCompleting(true);
    setError("");

    try {
      const response = await fetch("/api/games/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("errorCompleting"));
      }

      toast.success(t("gameCompleted"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("unknownError"));
    } finally {
      setCompleting(false);
    }
  };

  const handleCompleteGame = () => {
    toast(
      (toastObj) => (
        <div className="text-center">
          <p className="font-medium text-text-primary mb-2">
            {t("confirmComplete")}
          </p>
          <p className="text-sm text-text-secondary mb-4">{t("completeInfo")}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                toast.dismiss(toastObj.id);
                completeGame();
              }}
              className="bg-error text-white px-4 py-2 rounded-lg hover:bg-error/90 transition-colors"
            >
              {tCommon("ok")}
            </button>
            <button
              onClick={() => toast.dismiss(toastObj.id)}
              className="bg-surface-3 text-text-secondary px-4 py-2 rounded-lg hover:bg-surface-2 transition-colors"
            >
              {tCommon("cancel")}
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };

  // Helper for ordinal numbers
  const getOrdinal = (n: number) => {
    const ordinals = [
      tOrdinals("first"),
      tOrdinals("second"),
      tOrdinals("third"),
      tOrdinals("fourth"),
      tOrdinals("fifth"),
      tOrdinals("sixth"),
      tOrdinals("seventh"),
      tOrdinals("eighth"),
      tOrdinals("ninth"),
      tOrdinals("tenth"),
    ];
    return ordinals[n - 1] || `${n}.`;
  };

  return (
    <Card variant="surface" padding="lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-h3 text-text-primary">
          {t("roundLocations", { round: currentRound, count: locationsPerRound })}
        </h2>
        <Badge variant="primary" size="sm">
          {t("roundLabel", { number: currentRound })}
        </Badge>
      </div>

      {/* Admin controls */}
      {isAdmin && gameStatus === "active" && (
        <div className="pt-4 border-t border-glass-border space-y-3">
          {error && (
            <p className="text-error text-body-small mb-3">{error}</p>
          )}
          <Button
            variant="success"
            size="lg"
            fullWidth
            onClick={handleReleaseRound}
            disabled={loading || completing}
            isLoading={loading}
          >
            {loading
              ? t("releasing")
              : t("releaseRound", { number: currentRound + 1 })}
          </Button>
          <Button
            variant="danger"
            size="lg"
            fullWidth
            onClick={handleCompleteGame}
            disabled={loading || completing}
            isLoading={completing}
          >
            {completing ? t("completing") : t("completeGame")}
          </Button>
        </div>
      )}

      {/* Game completed message */}
      {isAdmin && gameStatus === "completed" && (
        <div className="pt-4 border-t border-glass-border">
          <p className="text-center text-success font-medium">
            {t("gameCompleted")}
          </p>
        </div>
      )}

      {/* Non-admin user status */}
      {!isAdmin && (
        <div className="pt-4 border-t border-glass-border">
          {userCompletedRounds < currentRound ? (
            <div className="flex items-center justify-center gap-2 text-primary">
              <svg
                className="w-5 h-5"
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
              <span>{t("openRoundsToPlay")}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-success">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>
                {t("playedRound", { ordinal: getOrdinal(userCompletedRounds) })}
              </span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
