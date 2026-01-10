"use client";

import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Script from "next/script";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { FloatingInput } from "@/components/ui/FloatingInput";

declare global {
  interface Window {
    turnstile: {
      render: (
        element: HTMLElement | string,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark";
          size?: "normal" | "compact";
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export default function RegisterPage() {
  const t = useTranslations("auth");
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || "de";

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [website, setWebsite] = useState(""); // Honeypot
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitResetAt, setRateLimitResetAt] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<string>("");

  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);

  // Initialize Turnstile
  const handleTurnstileLoad = () => {
    if (
      turnstileRef.current &&
      window.turnstile &&
      !turnstileWidgetId.current
    ) {
      const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

      if (!siteKey) {
        console.error("NEXT_PUBLIC_TURNSTILE_SITE_KEY not configured");
        // Allow form submission without Turnstile in development
        setTurnstileReady(true);
        setTurnstileToken("dev-bypass");
        return;
      }

      turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          setTurnstileToken(token);
          setTurnstileReady(true);
        },
        "error-callback": () => {
          setTurnstileToken(null);
          setError(t("captchaFailed"));
        },
        theme: "dark",
        size: "normal",
      });
    }
  };

  // Rate limit countdown
  useEffect(() => {
    if (!rateLimitResetAt) {
      setCountdown("");
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const diff = rateLimitResetAt.getTime() - now.getTime();

      if (diff <= 0) {
        setIsRateLimited(false);
        setRateLimitResetAt(null);
        setCountdown("");
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setCountdown(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [rateLimitResetAt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError(t("passwordsMismatch"));
      setIsLoading(false);
      return;
    }

    // Check Turnstile token (skip if no site key configured)
    if (!turnstileToken && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      setError(t("captchaRequired"));
      setIsLoading(false);
      return;
    }

    try {
      // Register user
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          nickname,
          email,
          password,
          locale,
          turnstileToken: turnstileToken || "dev-bypass",
          website, // honeypot
        }),
      });

      const data = await response.json();

      // Handle rate limiting
      if (response.status === 429) {
        setIsRateLimited(true);
        if (data.resetAt) {
          setRateLimitResetAt(new Date(data.resetAt));
        }
        setError(t("rateLimitExceeded", { minutes: "15" }));
        setIsLoading(false);

        // Reset Turnstile
        if (turnstileWidgetId.current && window.turnstile) {
          window.turnstile.reset(turnstileWidgetId.current);
        }
        setTurnstileToken(null);
        return;
      }

      if (!response.ok) {
        // Translate error codes
        if (data.error === "captcha_failed") {
          setError(t("captchaFailed"));
        } else if (data.error === "captcha_required") {
          setError(t("captchaRequired"));
        } else {
          setError(data.error || t("registerError"));
        }

        setIsLoading(false);

        // Reset Turnstile
        if (turnstileWidgetId.current && window.turnstile) {
          window.turnstile.reset(turnstileWidgetId.current);
        }
        setTurnstileToken(null);
        return;
      }

      // Redirect to verify-email page (no auto-login)
      router.push(
        `/${locale}/verify-email?email=${encodeURIComponent(email)}`
      );
    } catch {
      setError(t("registerError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: `/${locale}/guesser` });
  };

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        onLoad={handleTurnstileLoad}
        strategy="lazyOnload"
      />

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

        <div
          className={cn(
            "w-full max-w-md",
            "bg-surface-1/95 backdrop-blur-xl",
            "border border-glass-border",
            "rounded-lg p-6 md:p-8",
            "shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
          )}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              {t("registerTitle")}
            </h1>
            <p className="text-text-muted">{t("registerSubtitle")}</p>
          </div>

          {/* Rate Limit Warning */}
          {isRateLimited && countdown && (
            <div className="mb-4 p-4 bg-error/10 border border-error/30 rounded-lg">
              <p className="text-error text-sm text-center">
                {t("rateLimitExceeded", { minutes: countdown })}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <FloatingInput
              id="name"
              type="text"
              label={t("name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isRateLimited}
            />

            <FloatingInput
              id="nickname"
              type="text"
              label={t("nickname")}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={isRateLimited}
            />

            <FloatingInput
              id="email"
              type="email"
              label={t("email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isRateLimited}
            />

            <FloatingInput
              id="password"
              type="password"
              label={t("password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={isRateLimited}
            />

            <FloatingInput
              id="confirmPassword"
              type="password"
              label={t("confirmPassword")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              error={error || undefined}
              disabled={isRateLimited}
            />

            {/* Honeypot Field - visually hidden */}
            <input
              type="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              style={{
                position: "absolute",
                left: "-9999px",
                width: "1px",
                height: "1px",
              }}
              aria-hidden="true"
            />

            {/* Turnstile Widget */}
            <div ref={turnstileRef} className="flex justify-center" />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              disabled={isRateLimited || (!turnstileReady && !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)}
            >
              {isLoading ? t("registering") : t("register")}
            </Button>
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-text-muted mt-6">
            {t("hasAccount")}{" "}
            <Link
              href={`/${locale}`}
              className="text-primary hover:text-primary-light transition-colors font-medium cursor-pointer"
            >
              {t("login")}
            </Link>
          </p>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-glass-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-surface-1 text-text-muted">
                {t("orContinueWith")}
              </span>
            </div>
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className={cn(
              "w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg",
              "bg-white text-gray-800 font-medium",
              "border border-gray-200",
              "hover:bg-gray-50 transition-colors cursor-pointer"
            )}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>

          {/* Magic Link */}
          <Link
            href={`/${locale}/magic-link`}
            className={cn(
              "w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg mt-3",
              "bg-surface-2 text-text-secondary font-medium",
              "border border-glass-border",
              "hover:bg-surface-3 hover:text-text-primary transition-colors cursor-pointer"
            )}
          >
            <svg
              className="w-5 h-5"
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
            {t("magicLink")}
          </Link>
        </div>
      </div>
    </>
  );
}
