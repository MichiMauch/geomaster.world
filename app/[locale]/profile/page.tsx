"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { Button } from "@/components/ui/Button";
import { LevelProgress } from "@/components/ui/LevelBadge";
import { getDisplayName } from "@/lib/utils";

interface UserProfile {
  id: string;
  name: string | null;
  nickname: string | null;
  email: string | null;
  image: string | null;
}

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

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || "de";
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [nickname, setNickname] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}`);
    }
  }, [status, router, locale]);

  // Fetch profile and level data
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch profile and level data in parallel
        const [profileRes, levelRes] = await Promise.all([
          fetch("/api/user/profile"),
          fetch("/api/user/level", {
            headers: { "Accept-Language": locale },
          }),
        ]);

        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile(data);
          setNickname(data.nickname || "");
        }

        if (levelRes.ok) {
          const data = await levelRes.json();
          setLevelData(data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchData();
    }
  }, [status, locale]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || t("saveError"));
        return;
      }

      setSaved(true);
      setProfile((prev) => prev ? { ...prev, nickname: nickname.trim() || null } : null);

      // Clear saved message after 3 seconds
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError(t("saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session || !profile) {
    return null;
  }

  const displayName = getDisplayName(profile.name, profile.nickname);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card className="p-6 bg-surface-1/95 backdrop-blur-xl">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Avatar */}
            {profile.image ? (
              <img
                src={profile.image}
                alt={profile.name || "User"}
                className="w-20 h-20 rounded-full border-2 border-glass-border mx-auto mb-4"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-background text-2xl font-bold mx-auto mb-4">
                {profile.name
                  ? profile.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "?"}
              </div>
            )}

            <h1 className="text-2xl font-bold text-text-primary mb-1">
              {t("title")}
            </h1>
            <p className="text-text-muted text-sm">
              {profile.email}
            </p>
          </div>

          {/* Level Progress */}
          {levelData && (
            <div className="mb-6">
              <LevelProgress
                level={levelData.level}
                levelName={levelData.levelName}
                progress={levelData.progress}
                pointsToNext={levelData.pointsToNextLevel}
                nextLevelName={levelData.nextLevel?.levelName}
                isMaxLevel={levelData.isMaxLevel}
                locale={locale}
              />
              <p className="text-xs text-text-muted text-center mt-2">
                {levelData.totalPoints.toLocaleString()} {locale === "de" ? "Punkte gesamt" : locale === "sl" ? "skupaj točk" : "total points"}
              </p>
            </div>
          )}

          {/* Display Name Preview */}
          <div className="bg-surface-2 rounded-lg p-4 mb-6">
            <p className="text-xs text-text-muted mb-1">{t("displayedAs")}</p>
            <p className="text-lg font-medium text-text-primary">{displayName}</p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Name (read-only) */}
            <div>
              <label className="block text-sm text-text-muted mb-1">
                {t("name")}
              </label>
              <div className="px-4 py-3 bg-surface-2 rounded-lg text-text-secondary">
                {profile.name || "-"}
              </div>
            </div>

            {/* Nickname */}
            <FloatingInput
              id="nickname"
              type="text"
              label={t("nickname")}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={30}
            />

            <p className="text-xs text-text-muted">
              {t("nicknameHint")}
            </p>

            {/* Error */}
            {error && (
              <p className="text-sm text-error">{error}</p>
            )}

            {/* Success */}
            {saved && (
              <p className="text-sm text-success">{t("saved")}</p>
            )}

            {/* Save Button */}
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={nickname === (profile.nickname || "")}
            >
              {isSaving ? tCommon("save") + "..." : tCommon("save")}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
