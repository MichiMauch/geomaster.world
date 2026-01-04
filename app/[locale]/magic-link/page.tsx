"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FloatingInput } from "@/components/ui/FloatingInput";

export default function MagicLinkPage() {
  const t = useTranslations("auth");
  const params = useParams();
  const locale = (params.locale as string) || "de";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: `/${locale}/guesser`,
      });

      if (result?.error) {
        setStatus("error");
        setError(t("magicLinkError"));
      } else {
        setStatus("success");
      }
    } catch {
      setStatus("error");
      setError(t("magicLinkError"));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'url("/images/hero-map-bg.jpg")',
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/50" />
      </div>

      <Card className="w-full max-w-md p-8 bg-surface-1/95 backdrop-blur-xl">
        {status === "success" ? (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-4">
              {t("magicLinkSent")}
            </h1>
            <p className="text-text-muted mb-6">
              {t("magicLinkSentDescription")}
            </p>
            <p className="text-sm text-text-secondary mb-6">{email}</p>
            <Link
              href={`/${locale}`}
              className="text-sm text-primary hover:text-primary-light transition-colors"
            >
              {t("backToLogin")}
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-text-primary">
                {t("magicLinkTitle")}
              </h1>
              <p className="text-text-muted mt-2">
                {t("magicLinkDescription")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <FloatingInput
                id="email"
                type="email"
                label={t("email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                error={error || undefined}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={status === "loading"}
              >
                {status === "loading" ? t("magicLinkSending") : t("magicLinkSend")}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href={`/${locale}`}
                className="text-sm text-text-muted hover:text-text-secondary transition-colors"
              >
                {t("backToLogin")}
              </Link>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
