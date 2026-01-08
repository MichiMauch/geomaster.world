"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { LoginForm } from "./LoginForm";

export function LoginCard() {
  const t = useTranslations("auth");

  return (
    <div
      className={cn(
        "bg-surface-1/95 backdrop-blur-xl",
        "border border-glass-border",
        "rounded-lg p-5 md:p-6",
        "shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
      )}
    >
      <h2 className="text-xl font-bold text-text-primary mb-4 text-center">
        {t("login")}
      </h2>
      <LoginForm />
    </div>
  );
}
