"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FloatingInput } from "@/components/ui/FloatingInput";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const params = useParams();
  const locale = (params.locale as string) || "de";

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch {
      setError(t("resetLinkError"));
    } finally {
      setIsLoading(false);
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
        {!isSuccess ? (
          <>
            {/* Icon */}
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
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-text-primary mb-2 text-center">
              {t("forgotPasswordTitle")}
            </h1>
            <p className="text-text-muted mb-6 text-center text-sm">
              {t("forgotPasswordDescription")}
            </p>

            {/* Form */}
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
                size="md"
                className="w-full"
                isLoading={isLoading}
              >
                {t("sendResetLink")}
              </Button>
            </form>

            {/* Back to login */}
            <p className="text-center text-sm text-text-muted mt-6">
              <Link
                href={`/${locale}`}
                className="text-primary hover:text-primary-light transition-colors"
              >
                {t("backToLogin")}
              </Link>
            </p>
          </>
        ) : (
          <>
            {/* Success state */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-success"
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
            <h1 className="text-2xl font-bold text-text-primary mb-4 text-center">
              {t("checkEmail")}
            </h1>
            <p className="text-text-muted mb-6 text-center">
              {t("resetLinkSent")}
            </p>
            <p className="text-sm text-text-secondary mb-6 text-center">
              {email}
            </p>
            <Link
              href={`/${locale}`}
              className="block text-center text-primary hover:text-primary-light transition-colors"
            >
              {t("backToLogin")}
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}
