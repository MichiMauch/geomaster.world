"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

const cardVariants = cva(
  // Base styles
  "rounded-sm transition-all duration-300 ease-out",
  {
    variants: {
      variant: {
        // Surface card - Solid background
        surface: `bg-surface-1 border border-glass-border`,

        // Elevated surface
        elevated: `bg-surface-2 border border-glass-border-elevated
                   shadow-[0_0_30px_rgba(0,0,0,0.3)]`,

        // Glass card - Glassmorphism
        glass: `bg-glass-bg backdrop-blur-xl border border-glass-border`,

        // Glass elevated
        "glass-elevated": `bg-glass-bg-elevated backdrop-blur-2xl
                          border border-glass-border-elevated`,

        // Interactive - With hover effects
        interactive: `bg-surface-1 border border-glass-border
                      hover:bg-surface-2 hover:border-glass-border-elevated
                      hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(78,92,255,0.1)]
                      cursor-pointer`,

        // Highlight - For selected/active states
        highlight: `bg-surface-2 border-2 border-primary
                    shadow-[0_0_30px_rgba(78,92,255,0.2)]`,

        // Ghost - Minimal styling
        ghost: `bg-transparent`,
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
        xl: "p-8",
      },
    },
    defaultVariants: {
      variant: "surface",
      padding: "md",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding, className }))}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

// Card Header
const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

// Card Title
const CardTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-h3 text-text-primary", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

// Card Description
const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-body-small text-text-secondary", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

// Card Content
const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
CardContent.displayName = "CardContent";

// Card Footer
const CardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, cardVariants };
