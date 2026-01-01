"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { FloatingInput } from "@/components/ui/FloatingInput";

export function LoginForm() {
  const t = useTranslations("auth");
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || "de";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t("invalidCredentials"));
      } else {
        router.push(`/${locale}/guesser`);
        router.refresh();
      }
    } catch {
      setError(t("loginError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: `/${locale}/guesser` });
  };

  const handleGuestPlay = () => {
    router.push(`/${locale}/guesser`);
  };

  return (
    <div className="w-full space-y-6">
      {/* Email/Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
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
          error={error || undefined}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isLoading}
        >
          {isLoading ? t("loggingIn") : t("login")}
        </Button>
      </form>

      {/* Register Link */}
      <p className="text-center text-sm text-text-muted">
        {t("noAccount")}{" "}
        <Link
          href={`/${locale}/register`}
          className="text-primary hover:text-primary-light transition-colors font-medium cursor-pointer"
        >
          {t("register")}
        </Link>
      </p>

      {/* Divider */}
      <div className="relative">
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

      {/* Guest Play */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleGuestPlay}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg",
            "bg-surface-2 text-text-secondary",
            "border border-glass-border",
            "hover:bg-surface-3 hover:text-text-primary transition-colors cursor-pointer"
          )}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {t("playAsGuest")}
        </button>
        <p className="text-xs text-text-muted text-center mt-2">
          {t("guestInfo")}
        </p>
      </div>
    </div>
  );
}
