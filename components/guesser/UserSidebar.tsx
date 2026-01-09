"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { Card } from "@/components/ui/Card";
import { LevelProgress } from "@/components/ui/LevelBadge";
import { LoginCard } from "@/components/auth/LoginCard";
import { cn } from "@/lib/utils";

interface LevelData {
  level: number;
  levelName: string;
  totalPoints: number;
  progress: number;
  pointsToNextLevel: number;
  nextLevel: {
    level: number;
    levelName: string;
  } | null;
  isMaxLevel: boolean;
}

interface UserSidebarProps {
  className?: string;
}

export function UserSidebar({ className }: UserSidebarProps) {
  const { data: session, status } = useSession();
  const locale = useLocale();
  const [levelData, setLevelData] = useState<LevelData | null>(null);

  // Fetch level data when authenticated
  useEffect(() => {
    async function fetchLevelData() {
      try {
        const response = await fetch("/api/user/level", {
          headers: { "Accept-Language": locale },
        });
        if (response.ok) {
          const data = await response.json();
          setLevelData(data);
        }
      } catch (error) {
        console.error("Error fetching level data:", error);
      }
    }

    if (status === "authenticated") {
      fetchLevelData();
    }
  }, [status, locale]);

  if (status === "authenticated" && session?.user) {
    return (
      <Card variant="glass" className={cn("p-4 h-full backdrop-blur-md", className)}>
        <div className="flex items-center gap-3 mb-4">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || "User"}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {(session.user.name || "U")[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-foreground text-sm">
              {session.user.name}
            </p>
            {levelData && (
              <>
                <p className="text-[11px] text-success">
                  Level {levelData.level} · {levelData.levelName}
                </p>
                <p className="text-[11px] text-text-muted">
                  {levelData.totalPoints.toLocaleString()} {locale === "de" ? "Punkte" : locale === "sl" ? "točk" : "points"}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Level Progress */}
        {levelData && (
          <div className="pt-4 border-t border-glass-border">
            <LevelProgress
              level={levelData.level}
              levelName={levelData.levelName}
              progress={levelData.progress}
              pointsToNext={levelData.pointsToNextLevel}
              nextLevelName={levelData.nextLevel?.levelName}
              isMaxLevel={levelData.isMaxLevel}
              locale={locale}
            />
          </div>
        )}
      </Card>
    );
  }

  return <LoginCard className={className} />;
}
