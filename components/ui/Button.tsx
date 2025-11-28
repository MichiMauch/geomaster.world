"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

const buttonVariants = cva(
  // Base styles
  `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl
   font-semibold transition-all duration-200 ease-out
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
   focus-visible:ring-offset-background focus-visible:ring-primary
   disabled:pointer-events-none disabled:opacity-50
   active:scale-[0.98]`,
  {
    variants: {
      variant: {
        // Primary - Indigo filled
        primary: `bg-primary text-white hover:bg-primary-light
                  shadow-[0_0_20px_rgba(78,92,255,0.3)]
                  hover:shadow-[0_0_30px_rgba(78,92,255,0.4)]
                  hover:-translate-y-0.5`,

        // Secondary - Surface with border
        secondary: `bg-surface-2 text-text-primary border border-glass-border
                    hover:bg-surface-3 hover:border-glass-border-elevated
                    hover:-translate-y-0.5`,

        // Ghost - Transparent
        ghost: `bg-transparent text-text-secondary hover:text-text-primary
                hover:bg-surface-2`,

        // Outline - Border only
        outline: `bg-transparent border border-glass-border text-text-primary
                  hover:bg-surface-1 hover:border-glass-border-elevated`,

        // Accent - Gold for scores/achievements
        accent: `bg-accent text-background hover:bg-accent-light
                 shadow-[0_0_20px_rgba(255,176,58,0.3)]
                 hover:shadow-[0_0_30px_rgba(255,176,58,0.4)]
                 hover:-translate-y-0.5`,

        // Success - Green
        success: `bg-success text-white hover:brightness-110
                  shadow-[0_0_20px_rgba(16,185,129,0.3)]
                  hover:-translate-y-0.5`,

        // Danger - Red
        danger: `bg-error text-white hover:brightness-110
                 shadow-[0_0_20px_rgba(239,68,68,0.3)]
                 hover:-translate-y-0.5`,

        // Glass - Glassmorphism effect
        glass: `bg-glass-bg backdrop-blur-xl border border-glass-border
                text-text-primary hover:bg-glass-bg-elevated
                hover:border-glass-border-elevated`,
      },
      size: {
        sm: "h-9 px-3 text-sm rounded-lg",
        md: "h-11 px-5 text-base",
        lg: "h-14 px-8 text-lg",
        xl: "h-16 px-10 text-xl",
        icon: "h-11 w-11 p-0",
        "icon-sm": "h-9 w-9 p-0 rounded-lg",
        "icon-lg": "h-14 w-14 p-0",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
