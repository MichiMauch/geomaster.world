"use client";

import { useSession, signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface LoginPromptSectionProps {
  locale: string;
}

export default function LoginPromptSection({ locale }: LoginPromptSectionProps) {
  const { status } = useSession();
  const t = useTranslations("landing");

  // Only show for guests
  if (status !== "unauthenticated") {
    return null;
  }

  const benefits = [
    {
      icon: "🏆",
      text: t("loginPrompt.benefit1", { defaultValue: "Erscheine in den Rankings" })
    },
    {
      icon: "📊",
      text: t("loginPrompt.benefit2", { defaultValue: "Verfolge deine Statistiken" })
    },
    {
      icon: "👥",
      text: t("loginPrompt.benefit3", { defaultValue: "Spiele mit Freunden in Gruppen" })
    }
  ];

  const handleLogin = () => {
    signIn("google");
  };

  return (
    <section className="py-16 md:py-20">
      <div className="container max-w-3xl mx-auto px-4">
        <Card className="p-8 md:p-12 text-center bg-gradient-to-br from-primary/10 via-surface-2 to-accent/10 border-primary/20 shadow-[0_8px_24px_rgba(0,0,0,0.15),0_16px_48px_rgba(0,0,0,0.1)]">
          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            {t("loginPrompt.title", { defaultValue: "Melde dich an und sichere dir deinen Platz!" })}
          </h2>

          {/* Subtitle */}
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            {t("loginPrompt.subtitle", { defaultValue: "Spiele jederzeit als Gast - aber für Rankings und Statistiken brauchst du ein Konto." })}
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-foreground">
                <span className="text-xl">{benefit.icon}</span>
                <span>{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleLogin}
            size="xl"
            variant="primary"
            className="shadow-[0_4px_14px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.25),0_16px_40px_rgba(0,0,0,0.2)]"
          >
            {t("loginPrompt.cta", { defaultValue: "Mit Google anmelden" })}
          </Button>
        </Card>
      </div>
    </section>
  );
}
