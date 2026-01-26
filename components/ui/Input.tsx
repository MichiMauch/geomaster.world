"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

const inputVariants = cva(
  // Base styles
  `w-full rounded-lg bg-surface-2 border border-glass-border
   text-text-primary placeholder:text-text-muted caret-primary
   transition-all duration-200 ease-out
   focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
   disabled:cursor-not-allowed disabled:opacity-50`,
  {
    variants: {
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-4 text-base",
        lg: "h-14 px-5 text-lg",
      },
      variant: {
        default: "",
        error: "border-error focus:ring-error",
        success: "border-success focus:ring-success",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  error?: string;
  label?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, variant, error, label, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-body-small font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            inputVariants({ size, variant: error ? "error" : variant, className })
          )}
          {...props}
        />
        {error && (
          <p className="text-caption text-error">{error}</p>
        )}
        {hint && !error && (
          <p className="text-caption text-text-muted">{hint}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

// OTP Input (for invite codes)
interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const OTPInput = forwardRef<HTMLDivElement, OTPInputProps>(
  ({ length = 6, value, onChange, error }, ref) => {
    const handleChange = (index: number, char: string) => {
      if (char.length > 1) return;

      const newValue = value.split("");
      newValue[index] = char.toUpperCase();
      onChange(newValue.join(""));

      // Auto-focus next input
      if (char && index < length - 1) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !value[index] && index > 0) {
        const prevInput = document.getElementById(`otp-${index - 1}`);
        prevInput?.focus();
      }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text").toUpperCase().slice(0, length);
      onChange(pastedData);
    };

    return (
      <div ref={ref} className="space-y-2">
        <div className="flex gap-2 justify-center">
          {Array.from({ length }).map((_, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              inputMode="text"
              maxLength={1}
              value={value[index] || ""}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={cn(
                `w-12 h-14 text-center text-xl font-bold rounded-lg
                 bg-surface-2 border border-glass-border text-text-primary caret-primary
                 transition-all duration-200 ease-out
                 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`,
                error && "border-error focus:ring-error"
              )}
            />
          ))}
        </div>
        {error && (
          <p className="text-caption text-error text-center">{error}</p>
        )}
      </div>
    );
  }
);
OTPInput.displayName = "OTPInput";

export { Input, OTPInput, inputVariants };
