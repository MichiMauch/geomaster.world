"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

interface OptionButtonProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export const OptionButton = memo(function OptionButton({
  selected,
  onClick,
  children,
  className,
}: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "py-2 px-3 rounded-lg border-2 font-medium transition-all text-sm",
        selected
          ? "border-success bg-success/10 text-success"
          : "border-glass-border bg-surface-2 text-text-secondary hover:border-success/50",
        className
      )}
    >
      {children}
    </button>
  );
});
