"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          placeholder=" "
          className={cn(
            "peer w-full px-4 pt-6 pb-2 rounded-lg",
            "bg-surface-2 border border-glass-border",
            "text-text-primary placeholder-transparent",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "transition-all duration-200",
            error && "border-error focus:ring-error",
            className
          )}
          {...props}
        />
        <label
          htmlFor={inputId}
          className={cn(
            "absolute left-4 top-4",
            "text-text-muted text-base",
            "transition-all duration-200 ease-out",
            "pointer-events-none origin-left",
            // When focused or has content
            "peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary",
            "peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs",
            error && "peer-focus:text-error"
          )}
        >
          {label}
        </label>
        {error && (
          <p className="text-xs text-error mt-1 ml-1">{error}</p>
        )}
      </div>
    );
  }
);

FloatingInput.displayName = "FloatingInput";

export { FloatingInput };
