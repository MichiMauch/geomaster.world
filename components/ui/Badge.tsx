"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

const badgeVariants = cva(
  // Base styles
  `inline-flex items-center justify-center rounded-full
   font-medium transition-colors`,
  {
    variants: {
      variant: {
        default: "bg-surface-3 text-text-secondary",
        primary: "bg-primary/20 text-primary-light",
        accent: "bg-accent/20 text-accent",
        success: "bg-success/20 text-success",
        warning: "bg-warning/20 text-warning",
        error: "bg-error/20 text-error",
        outline: "bg-transparent border border-glass-border text-text-secondary",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

// Medal badges for leaderboard
interface MedalBadgeProps {
  position: number;
  className?: string;
}

const MedalBadge = ({ position, className }: MedalBadgeProps) => {
  if (position > 3) return null;

  const medals = {
    1: { emoji: "🥇", bg: "bg-yellow-500/20", text: "text-yellow-400" },
    2: { emoji: "🥈", bg: "bg-gray-400/20", text: "text-gray-300" },
    3: { emoji: "🥉", bg: "bg-orange-600/20", text: "text-orange-400" },
  };

  const medal = medals[position as 1 | 2 | 3];

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-8 h-8 rounded-full text-lg",
        medal.bg,
        className
      )}
    >
      {medal.emoji}
    </span>
  );
};

export { Badge, MedalBadge, badgeVariants };
