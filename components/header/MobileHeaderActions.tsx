"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { NotificationBell } from "./NotificationBell";

export function MobileHeaderActions() {
  const { data: session, status } = useSession();
  const params = useParams();
  const locale = (params.locale as string) || "de";

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2 sm:hidden">
        <div className="w-8 h-8 rounded-full bg-surface-2 animate-pulse" />
      </div>
    );
  }

  const user = session?.user;

  if (!user) {
    return (
      <div className="flex items-center gap-2 sm:hidden">
        <Link
          href={`/${locale}/register`}
          className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center text-text-secondary text-sm font-bold"
        >
          A
        </Link>
      </div>
    );
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="flex items-center gap-2 sm:hidden">
      <NotificationBell locale={locale} />
      <Link
        href={`/${locale}/profile`}
        className="block"
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || "User"}
            className="w-8 h-8 rounded-full border border-glass-border"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-background text-sm font-bold">
            {initials}
          </div>
        )}
      </Link>
    </div>
  );
}
