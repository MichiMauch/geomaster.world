"use client";

import { useTranslations } from "next-intl";

interface HowItWorksSectionProps {
  locale: string;
}

const steps = [
  {
    icon: "🎯",
    titleKey: "howItWorks.step1Title",
    descKey: "howItWorks.step1Desc",
    defaultTitle: "Wähle Spieltyp",
    defaultDesc: "Schweiz, Slowenien oder Welt-Quiz",
    color: "#00D9FF",
  },
  {
    icon: "🗺️",
    titleKey: "howItWorks.step2Title",
    descKey: "howItWorks.step2Desc",
    defaultTitle: "Setze Marker",
    defaultDesc: "Tippe auf die Karte, wo du den Ort vermutest",
    color: "#00FF88",
  },
  {
    icon: "⏱️",
    titleKey: "howItWorks.step3Title",
    descKey: "howItWorks.step3Desc",
    defaultTitle: "Zeitbonus",
    defaultDesc: "Je schneller du bist, desto mehr Punkte",
    color: "#FF6B35",
  },
  {
    icon: "🏆",
    titleKey: "howItWorks.step4Title",
    descKey: "howItWorks.step4Desc",
    defaultTitle: "Steige auf",
    defaultDesc: "Kämpfe um die Top-Plätze im Ranking",
    color: "#FFD700",
  },
];

export default function HowItWorksSection({ locale }: HowItWorksSectionProps) {
  const t = useTranslations("landing");

  return (
    <section className="py-16 md:py-20 bg-surface-1">
      <div className="container max-w-5xl mx-auto px-4">
        {/* Section Title */}
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("howItWorks.title", { defaultValue: "So funktioniert's" })}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t("howItWorks.subtitle", { defaultValue: "In 4 einfachen Schritten zum Geografie-Profi" })}
          </p>
        </div>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-6 rounded-lg bg-surface-2/50 border border-glass-border"
            >
              {/* Icon */}
              <div
                className="flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center text-3xl"
                style={{ backgroundColor: `${step.color}20` }}
              >
                {step.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3
                  className="text-lg md:text-xl font-bold mb-1"
                  style={{ color: step.color }}
                >
                  {t(step.titleKey, { defaultValue: step.defaultTitle })}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  {t(step.descKey, { defaultValue: step.defaultDesc })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
