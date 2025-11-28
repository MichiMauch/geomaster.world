"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ActionBarProps {
  /** Primary button text */
  buttonText: string;
  /** Loading state button text */
  loadingText?: string;
  /** Hint text shown below the button when action is disabled */
  hintText?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether the button is loading */
  isLoading?: boolean;
  /** Click handler */
  onClick: () => void;
  /** Button variant */
  variant?: "primary" | "accent" | "success";
  /** Additional className */
  className?: string;
}

export function ActionBar({
  buttonText,
  loadingText = "Loading...",
  hintText,
  disabled = false,
  isLoading = false,
  onClick,
  variant = "primary",
  className,
}: ActionBarProps) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-gradient-to-t from-background via-background/95 to-transparent",
        "pt-8 pb-4 px-4 safe-area-bottom",
        className
      )}
    >
      <div className="max-w-lg mx-auto space-y-3">
        <Button
          variant={variant}
          size="xl"
          fullWidth
          onClick={onClick}
          disabled={disabled}
          isLoading={isLoading}
          className="shadow-lg"
        >
          {isLoading ? loadingText : buttonText}
        </Button>

        {hintText && disabled && !isLoading && (
          <p className="text-center text-caption text-text-muted animate-fade-in">
            {hintText}
          </p>
        )}
      </div>
    </div>
  );
}

// Variant with two buttons (e.g., for results: "Next" and "To Leaderboard")
interface ActionBarDualProps {
  primaryText: string;
  secondaryText: string;
  onPrimaryClick: () => void;
  onSecondaryClick: () => void;
  primaryLoading?: boolean;
  secondaryLoading?: boolean;
  className?: string;
}

export function ActionBarDual({
  primaryText,
  secondaryText,
  onPrimaryClick,
  onSecondaryClick,
  primaryLoading = false,
  secondaryLoading = false,
  className,
}: ActionBarDualProps) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-gradient-to-t from-background via-background/95 to-transparent",
        "pt-8 pb-4 px-4 safe-area-bottom",
        className
      )}
    >
      <div className="max-w-lg mx-auto flex gap-3">
        <Button
          variant="secondary"
          size="lg"
          onClick={onSecondaryClick}
          isLoading={secondaryLoading}
          className="flex-1"
        >
          {secondaryText}
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={onPrimaryClick}
          isLoading={primaryLoading}
          className="flex-1"
        >
          {primaryText}
        </Button>
      </div>
    </div>
  );
}
