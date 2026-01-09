"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import GameTypeSelector from "@/components/guesser/GameTypeSelector";
import RankingsTable from "@/components/guesser/RankingsTable";
import PeriodSelector from "@/components/guesser/PeriodSelector";
import type { RankingPeriod } from "@/lib/services/ranking-service";

export default function LeaderboardsPage() {
  const { data: session } = useSession();
  const t = useTranslations("ranked");

  const [selectedGameType, setSelectedGameType] = useState<string>("overall");
  const [selectedPeriod, setSelectedPeriod] = useState<RankingPeriod>("alltime");
  const [rankings, setRankings] = useState<{ rank: number; userId: string; userName: string | null; userImage: string | null; totalScore: number; totalGames: number; averageScore: number; bestScore: number }[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch rankings when gameType or period changes
  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/ranked/leaderboard?gameType=${selectedGameType}&period=${selectedPeriod}`
        );
        if (response.ok) {
          const data = await response.json();
          setRankings(data.rankings || []);
        }
      } catch (error) {
        console.error("Error fetching rankings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [selectedGameType, selectedPeriod]);

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          {t("leaderboards", { defaultValue: "Ranglisten" })}
        </h1>
        <p className="text-muted-foreground">
          {t("leaderboardsSubtitle", { defaultValue: "Siehe die besten Spieler in allen Kategorien" })}
        </p>
      </div>

      {/* Period Selector */}
      <div className="mb-6">
        <PeriodSelector selected={selectedPeriod} onChange={setSelectedPeriod} />
      </div>

      {/* Game Type Selector */}
      <Card className="mb-6 p-6">
        <h3 className="text-lg font-semibold mb-4">
          {t("filterByGameType", { defaultValue: "Filter nach Spieltyp" })}
        </h3>
        <div className="mb-4">
          <button
            onClick={() => setSelectedGameType("overall")}
            className={`px-4 py-2 rounded-lg font-medium transition-all mr-2 ${
              selectedGameType === "overall"
                ? "bg-primary text-primary-foreground"
                : "bg-background/50 text-foreground hover:bg-accent/10"
            }`}
          >
            {t("overall", { defaultValue: "Gesamt" })}
          </button>
        </div>
        <GameTypeSelector
          selected={selectedGameType === "overall" ? null : selectedGameType}
          onChange={setSelectedGameType}
          excludeImageTypes={true}
        />
      </Card>

      {/* Rankings Table */}
      <Card className="p-6">
        <RankingsTable
          rankings={rankings}
          highlightUserId={session?.user?.id}
          loading={loading}
        />
      </Card>
    </div>
  );
}
