"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { logger } from "@/lib/logger";

interface PersonalStatsSectionProps {
  locale: string;
}

interface UserStats {
  totalGames: number;
  totalScore: number;
  bestScore: number;
  averageScore: number;
}

export default function PersonalStatsSection({ locale }: PersonalStatsSectionProps) {
  const { data: session, status } = useSession();
  const t = useTranslations("landing");
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await fetch("/api/ranked/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        }
      } catch (error) {
        logger.error("Error fetching stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [session, status]);

  // Only show for authenticated users with stats
  if (status !== "authenticated" || loading) {
    return null;
  }

  if (!stats || stats.totalGames === 0) {
    return null;
  }

  const statCards = [
    {
      label: t("stats.gamesPlayed", { defaultValue: "Spiele" }),
      value: stats.totalGames.toString(),
      icon: "🎮"
    },
    {
      label: t("stats.bestScore", { defaultValue: "Beste Punktzahl" }),
      value: stats.bestScore.toString(),
      icon: "🏆"
    },
    {
      label: t("stats.avgScore", { defaultValue: "Durchschnitt" }),
      value: stats.averageScore.toFixed(0),
      icon: "📊"
    }
  ];

  return (
    <section className="py-16 md:py-20 bg-surface-1">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Section Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("stats.title", { defaultValue: "Deine Statistiken" })}
          </h2>
          <p className="text-muted-foreground">
            {t("stats.subtitle", { defaultValue: "So hast du bisher abgeschnitten" })}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
          {statCards.map((stat, index) => (
            <Card
              key={index}
              className="p-6 text-center bg-surface-2 border-surface-3 shadow-[0_4px_12px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.15),0_16px_40px_rgba(0,0,0,0.1)] transition-all duration-300"
            >
              {/* Icon */}
              <div className="text-4xl mb-3">{stat.icon}</div>

              {/* Value */}
              <div className="text-3xl font-bold text-primary mb-1">
                {stat.value}
              </div>

              {/* Label */}
              <div className="text-sm text-muted-foreground">
                {stat.label}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
