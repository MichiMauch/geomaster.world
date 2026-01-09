"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { LoginForm } from "./LoginForm";

interface LoginCardProps {
  className?: string;
}

export function LoginCard({ className }: LoginCardProps) {
  const t = useTranslations("auth");

  return (
    <div
      className={cn(
        "bg-glass-bg-elevated backdrop-blur-md",
        "border border-glass-border-elevated",
        "rounded-lg p-5 md:p-6",
        "shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
        className
      )}
    >
      <h2 className="text-xl font-bold text-text-primary mb-4 text-center">
        {t("login")}
      </h2>
      <LoginForm />
    </div>
  );
}
