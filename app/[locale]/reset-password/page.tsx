"use client";

import { useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FloatingInput } from "@/components/ui/FloatingInput";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = (params.locale as string) || "de";
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError(t("passwordsDoNotMatch"));
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError(t("passwordTooShort"));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push(`/${locale}`);
        }, 3000);
      } else {
        setError(data.error);
      }
    } catch {
      setError(t("resetPasswordError"));
    } finally {
      setIsLoading(false);
    }
  };

  // No token provided
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
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

        <Card className="w-full max-w-md p-8 bg-surface-1/95 backdrop-blur-xl text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-error/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-error"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-4">
            {t("invalidLink")}
          </h1>
          <p className="text-text-muted mb-6">
            {t("invalidLinkDescription")}
          </p>
          <Link
            href={`/${locale}/forgot-password`}
            className="text-primary hover:text-primary-light transition-colors"
          >
            {t("requestNewLink")}
          </Link>
        </Card>
      </div>
    );
  }

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
              {t("resetPasswordTitle")}
            </h1>
            <p className="text-text-muted mb-6 text-center text-sm">
              {t("resetPasswordDescription")}
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <FloatingInput
                id="password"
                type="password"
                label={t("newPassword")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <FloatingInput
                id="confirmPassword"
                type="password"
                label={t("confirmPassword")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                {t("resetPassword")}
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-4 text-center">
              {t("passwordResetSuccess")}
            </h1>
            <p className="text-text-muted mb-6 text-center">
              {t("redirectingToLogin")}
            </p>
            <Link
              href={`/${locale}`}
              className="block text-center text-primary hover:text-primary-light transition-colors"
            >
              {t("loginNow")}
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}
