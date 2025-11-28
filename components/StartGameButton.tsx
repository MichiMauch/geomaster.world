"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface StartGameButtonProps {
  groupId: string;
}

export default function StartGameButton({ groupId }: StartGameButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("game");

  const handleStartGame = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("errorStarting"));
      }

      // Refresh the page to show the new game
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("unknownError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      variant="surface"
      padding="lg"
      className="border-success/30 bg-success/5"
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-success/20 flex items-center justify-center">
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
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-h3 text-success">{t("newGame")}</h3>
          {error ? (
            <p className="text-body-small text-error">{error}</p>
          ) : (
            <p className="text-body-small text-text-secondary">
              {t("startWeeklyGame")}
            </p>
          )}
        </div>
        <Button
          variant="success"
          size="md"
          onClick={handleStartGame}
          isLoading={loading}
        >
          {loading ? t("starting") : t("startGame")}
        </Button>
      </div>
    </Card>
  );
}
