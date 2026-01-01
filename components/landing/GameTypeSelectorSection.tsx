"use client";

import { useTranslations } from "next-intl";
import GameTypeSelector from "@/components/guesser/GameTypeSelector";

interface GameTypeSelectorSectionProps {
  locale: string;
}

export default function GameTypeSelectorSection({ locale }: GameTypeSelectorSectionProps) {
  const t = useTranslations("landing");

  return (
    <section className="py-16 md:py-20 bg-surface-1">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Section Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("gameTypes.title", { defaultValue: "Wähle deinen Spieltyp" })}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t("gameTypes.subtitle", { defaultValue: "Von lokalen Schweizer Orten bis zu weltweiten Herausforderungen" })}
          </p>
        </div>

        {/* Game Type Selector */}
        <div className="max-w-4xl mx-auto">
          <GameTypeSelector
            navigationMode={true}
            excludeImageTypes={true}
            basePath="/guesser"
          />
        </div>
      </div>
    </section>
  );
}
