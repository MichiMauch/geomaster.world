"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export default function NewGroupPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("newGroup");
  const tCommon = useTranslations("common");
  const [name, setName] = useState("");
  const [locationsPerRound, setLocationsPerRound] = useState(5);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          locationsPerRound,
          timeLimitSeconds,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create group");
      }

      const data = await response.json();
      router.push(`/${locale}/groups/${data.id}`);
    } catch {
      setError(t("errorCreating"));
    } finally {
      setLoading(false);
    }
  };

  const locationOptions = [3, 5, 10];
  const timeLimitOptions = [
    { value: null, label: t("noLimit") },
    { value: 15, label: t("seconds", { count: 15 }) },
    { value: 30, label: t("seconds", { count: 30 }) },
    { value: 60, label: t("seconds", { count: 60 }) },
    { value: 120, label: t("minutes", { count: 2 }) },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-glass-border bg-surface-1/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">{tCommon("back")}</span>
          </Link>
          <h1 className="text-h3 text-primary">{t("title")}</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        <Card variant="elevated" padding="xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-h2 text-text-primary">{t("title")}</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label={t("groupName")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("groupNamePlaceholder")}
              required
            />

            {/* Locations per Round */}
            <div className="space-y-2">
              <label className="block text-body-small font-medium text-text-primary">
                {t("locationsPerRound")}
              </label>
              <div className="flex gap-2">
                {locationOptions.map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setLocationsPerRound(count)}
                    className={cn(
                      "flex-1 py-3 rounded-xl border-2 font-medium transition-all",
                      locationsPerRound === count
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-glass-border bg-surface-2 text-text-secondary hover:border-primary/50"
                    )}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Limit */}
            <div className="space-y-2">
              <label className="block text-body-small font-medium text-text-primary">
                {t("timeLimitPerLocation")}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {timeLimitOptions.map((option) => (
                  <button
                    key={option.value ?? "none"}
                    type="button"
                    onClick={() => setTimeLimitSeconds(option.value)}
                    className={cn(
                      "py-3 px-2 rounded-xl border-2 text-sm font-medium transition-all",
                      timeLimitSeconds === option.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-glass-border bg-surface-2 text-text-secondary hover:border-primary/50"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-error text-body-small text-center">{error}</p>
            )}

            <Button
              type="submit"
              variant="success"
              size="lg"
              fullWidth
              disabled={!name}
              isLoading={loading}
            >
              {loading ? t("creating") : t("createGroup")}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
