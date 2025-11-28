"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

const avatarVariants = cva(
  // Base styles
  `inline-flex items-center justify-center rounded-full
   font-semibold text-white overflow-hidden
   bg-gradient-to-br from-primary to-primary-dark`,
  {
    variants: {
      size: {
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
        xl: "h-16 w-16 text-xl",
        "2xl": "h-20 w-20 text-2xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string | null;
  name?: string | null;
  fallback?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, src, name, fallback, ...props }, ref) => {
    const initials = name ? getInitials(name) : fallback || "?";

    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size, className }))}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={name || "Avatar"}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

// Avatar with status indicator
interface AvatarWithStatusProps extends AvatarProps {
  status?: "online" | "offline" | "away" | "ready";
}

const AvatarWithStatus = forwardRef<HTMLDivElement, AvatarWithStatusProps>(
  ({ status, size = "md", ...props }, ref) => {
    const statusColors = {
      online: "bg-success",
      offline: "bg-text-muted",
      away: "bg-warning",
      ready: "bg-success animate-pulse",
    };

    const statusSizes = {
      sm: "h-2 w-2",
      md: "h-2.5 w-2.5",
      lg: "h-3 w-3",
      xl: "h-4 w-4",
      "2xl": "h-5 w-5",
    };

    return (
      <div ref={ref} className="relative inline-block">
        <Avatar size={size} {...props} />
        {status && (
          <span
            className={cn(
              "absolute bottom-0 right-0 rounded-full border-2 border-background",
              statusColors[status],
              statusSizes[size || "md"]
            )}
          />
        )}
      </div>
    );
  }
);
AvatarWithStatus.displayName = "AvatarWithStatus";

export { Avatar, AvatarWithStatus, avatarVariants };
