"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FloatingInput } from "@/components/ui/FloatingInput";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || "de";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    try {
      // Register user
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t("registerError"));
        setIsLoading(false);
        return;
      }

      // Auto-login after successful registration
      const loginResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (loginResult?.error) {
        // Registration succeeded but login failed - redirect to login
        router.push(`/${locale}/login`);
      } else {
        router.push(`/${locale}/guesser`);
        router.refresh();
      }
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'url("/images/hero-map-bg.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/50" />
      </div>

      <Card className="w-full max-w-md p-8 bg-surface-1/95 backdrop-blur-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            {t("registerTitle")}
          </h1>
          <p className="text-text-muted">
            {t("registerSubtitle")}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <FloatingInput
            id="name"
            type="text"
            label={t("name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <FloatingInput
            id="email"
            type="email"
            label={t("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <FloatingInput
            id="password"
            type="password"
            label={t("password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
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
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
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
      </Card>
    </div>
  );
}
