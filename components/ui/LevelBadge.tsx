"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const levelBadgeVariants = cva(
  "inline-flex items-center gap-1.5 font-medium transition-all",
  {
    variants: {
      size: {
        sm: "text-xs px-2 py-0.5 rounded-md",
        md: "text-sm px-2.5 py-1 rounded-lg",
        lg: "text-base px-3 py-1.5 rounded-lg",
      },
      variant: {
        default: "bg-surface-2 text-text-secondary border border-glass-border",
        primary: "bg-primary/20 text-primary border border-primary/30",
        glow: "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(0,217,255,0.3)]",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
);

export interface LevelBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof levelBadgeVariants> {
  level: number;
  levelName?: string;
  showName?: boolean;
}

export function LevelBadge({
  level,
  levelName,
  showName = true,
  size,
  variant,
  className,
  ...props
}: LevelBadgeProps) {
  return (
    <div className={cn(levelBadgeVariants({ size, variant }), className)} {...props}>
      <span className="font-bold">Lv.{level}</span>
      {showName && levelName && (
        <span className="text-text-secondary">{levelName}</span>
      )}
    </div>
  );
}

export interface LevelProgressProps {
  level: number;
  levelName: string;
  progress: number;
  pointsToNext: number;
  nextLevelName?: string;
  isMaxLevel?: boolean;
  locale?: string;
}

export function LevelProgress({
  level,
  levelName,
  progress,
  pointsToNext,
  nextLevelName,
  isMaxLevel,
  locale = "en",
}: LevelProgressProps) {
  const progressText = {
    de: isMaxLevel
      ? "Maximales Level erreicht!"
      : `${pointsToNext.toLocaleString()} Punkte bis ${nextLevelName}`,
    en: isMaxLevel
      ? "Maximum level reached!"
      : `${pointsToNext.toLocaleString()} points to ${nextLevelName}`,
    sl: isMaxLevel
      ? "Dosežena je najvišja raven!"
      : `${pointsToNext.toLocaleString()} točk do ${nextLevelName}`,
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-success">{levelName}</span>
        <span className="text-xs text-text-muted">
          {Math.round(progress * 100)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-success rounded-full transition-all duration-500"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      <p className="text-xs text-text-muted">
        {progressText[locale as keyof typeof progressText] || progressText.en}
      </p>
    </div>
  );
}
