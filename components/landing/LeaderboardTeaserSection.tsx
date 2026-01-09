"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { MedalBadge } from "@/components/ui/Badge";
import { logger } from "@/lib/logger";

interface LeaderboardTeaserSectionProps {
  locale: string;
}

interface TopPlayer {
  rank: number;
  userId: string;
  userName: string | null;
  userImage: string | null;
  bestScore: number;
  totalGames: number;
}

export default function LeaderboardTeaserSection({ locale }: LeaderboardTeaserSectionProps) {
  const router = useRouter();
  const t = useTranslations("landing");
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopPlayers = async () => {
      try {
        const response = await fetch("/api/ranked/leaderboard?period=daily&limit=3");
        if (response.ok) {
          const data = await response.json();
          setTopPlayers(data.rankings || []);
        }
      } catch (error) {
        logger.error("Error fetching leaderboard", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopPlayers();
  }, []);

  const handleViewAll = () => {
    router.push(`/${locale}/guesser/leaderboards`);
  };

  // Don't render if no data
  if (!loading && topPlayers.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-20">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Section Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("leaderboard.title", { defaultValue: "Heutige Top-Spieler" })}
          </h2>
          <p className="text-muted-foreground">
            {t("leaderboard.subtitle", { defaultValue: "Kannst du sie schlagen?" })}
          </p>
        </div>

        {/* Podium */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="flex justify-center items-end gap-4 mb-8">
            {/* Reorder for podium effect: 2nd, 1st, 3rd */}
            {[topPlayers[1], topPlayers[0], topPlayers[2]].map((player, displayIndex) => {
              if (!player) return <div key={displayIndex} className="w-28" />;

              const isFirst = displayIndex === 1;
              const isSecond = displayIndex === 0;
              const isThird = displayIndex === 2;

              return (
                <Card
                  key={player.userId}
                  className={`
                    text-center p-4 bg-surface-2 border-surface-3
                    shadow-[0_4px_12px_rgba(0,0,0,0.15),0_8px_24px_rgba(0,0,0,0.1)]
                    transition-all duration-300 hover:-translate-y-1
                    ${isFirst ? "w-36 pb-8" : "w-28"}
                    ${isFirst ? "order-2" : isSecond ? "order-1" : "order-3"}
                  `}
                  style={{
                    marginBottom: isFirst ? 0 : isSecond ? 0 : 0,
                    paddingTop: isFirst ? "2rem" : "1rem"
                  }}
                >
                  {/* Medal */}
                  <div className="mb-3">
                    <MedalBadge position={player.rank} />
                  </div>

                  {/* Avatar */}
                  <div className="flex justify-center mb-3">
                    <Avatar
                      src={player.userImage}
                      size={isFirst ? "lg" : "md"}
                    />
                  </div>

                  {/* Name */}
                  <div className={`font-semibold text-foreground truncate ${isFirst ? "text-base" : "text-sm"}`}>
                    {player.userName || "Anonym"}
                  </div>

                  {/* Score */}
                  <div className={`text-primary font-bold ${isFirst ? "text-xl" : "text-lg"}`}>
                    {player.bestScore}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("leaderboard.points", { defaultValue: "Punkte" })}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* View All Button */}
        <div className="text-center">
          <Button
            onClick={handleViewAll}
            variant="outline"
            className="shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
          >
            {t("leaderboard.viewAll", { defaultValue: "Alle Rankings anzeigen" })}
          </Button>
        </div>
      </div>
    </section>
  );
}
