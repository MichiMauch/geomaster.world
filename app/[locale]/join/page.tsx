"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function JoinPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("join");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to join group");
      }

      router.push(`/${locale}/groups/${data.groupId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("error")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-xl mx-auto px-4 py-8">
        <Card variant="elevated" padding="xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-h2 text-text-primary mb-2">{t("title")}</h2>
            <p className="text-text-secondary">{t("subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label={t("inviteCode")}
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder={t("placeholder")}
              className="font-mono text-lg tracking-wider text-center"
              required
            />

            {error && (
              <p className="text-error text-body-small text-center">{error}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={!inviteCode}
              isLoading={loading}
            >
              {loading ? t("submitting") : t("submit")}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
