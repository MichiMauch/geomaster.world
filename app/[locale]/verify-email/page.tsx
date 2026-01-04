"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function VerifyEmailPage() {
  const t = useTranslations("auth");
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = (params.locale as string) || "de";
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "pending">(
    token ? "loading" : "pending"
  );
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`/api/auth/verify?token=${token}`);
      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push(`/${locale}`);
        }, 3000);
      } else {
        setStatus("error");
        setError(data.error);
      }
    } catch {
      setStatus("error");
      setError(t("verificationError"));
    }
  };

  const handleResend = async () => {
    if (!email) return;

    setIsResending(true);
    setResendSuccess(false);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });

      if (response.ok) {
        setResendSuccess(true);
      }
    } catch {
      // Silently fail - don't reveal if email exists
    } finally {
      setIsResending(false);
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

      <Card className="w-full max-w-md p-8 bg-surface-1/95 backdrop-blur-xl text-center">
        {/* Pending - User just registered */}
        {status === "pending" && (
          <>
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
              {t("checkEmail")}
            </h1>
            <p className="text-text-muted mb-6">
              {t("verificationEmailSent")}
            </p>
            {email && (
              <p className="text-sm text-text-secondary mb-6">
                {email}
              </p>
            )}
            {email && (
              <Button
                variant="secondary"
                onClick={handleResend}
                isLoading={isResending}
                disabled={resendSuccess}
                className="mb-4"
              >
                {resendSuccess ? t("emailResent") : t("resendEmail")}
              </Button>
            )}
            <Link
              href={`/${locale}`}
              className="text-sm text-primary hover:text-primary-light transition-colors"
            >
              {t("backToLogin")}
            </Link>
          </>
        )}

        {/* Loading - Verifying token */}
        {status === "loading" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-primary animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-4">
              {t("verifying")}
            </h1>
          </>
        )}

        {/* Success */}
        {status === "success" && (
          <>
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
            <h1 className="text-2xl font-bold text-text-primary mb-4">
              {t("emailVerified")}
            </h1>
            <p className="text-text-muted mb-6">
              {t("redirectingToLogin")}
            </p>
            <Link
              href={`/${locale}`}
              className="text-primary hover:text-primary-light transition-colors"
            >
              {t("loginNow")}
            </Link>
          </>
        )}

        {/* Error */}
        {status === "error" && (
          <>
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
              {t("verificationFailed")}
            </h1>
            <p className="text-text-muted mb-6">
              {error || t("verificationError")}
            </p>
            <Link
              href={`/${locale}`}
              className="text-primary hover:text-primary-light transition-colors"
            >
              {t("backToLogin")}
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}
