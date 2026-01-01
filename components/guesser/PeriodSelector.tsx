"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { RankingPeriod } from "@/lib/services/ranking-service";

interface PeriodSelectorProps {
  selected: RankingPeriod;
  onChange: (period: RankingPeriod) => void;
}

export default function PeriodSelector({ selected, onChange }: PeriodSelectorProps) {
  const t = useTranslations("ranked");

  const periods: { value: RankingPeriod; label: string }[] = [
    { value: "daily", label: t("daily", { defaultValue: "Täglich" }) },
    { value: "weekly", label: t("weekly", { defaultValue: "Wöchentlich" }) },
    { value: "monthly", label: t("monthly", { defaultValue: "Monatlich" }) },
    { value: "alltime", label: t("alltime", { defaultValue: "Gesamt" }) },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-all duration-300",
            "border",
            selected === period.value
              ? "bg-primary text-primary-foreground border-primary shadow-[0_4px_12px_rgba(0,0,0,0.15)] -translate-y-0.5"
              : "bg-surface-2 text-foreground border-surface-3 shadow-[0_2px_4px_rgba(0,0,0,0.1)]",
            "hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]",
            "active:translate-y-0 active:shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
          )}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}
