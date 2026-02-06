"use client";

import Link from "next/link";
import { Trophy, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    icon: () => (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
      </svg>
    ),
    route: "/guesser",
    labels: { de: "Spiele", en: "Games", sl: "Igre" },
  },
  {
    icon: Trophy,
    route: "/guesser/leaderboards/ranked",
    labels: { de: "Solo", en: "Solo", sl: "Solo" },
  },
  {
    icon: Swords,
    route: "/guesser/leaderboards/duels",
    labels: { de: "Duelle", en: "Duels", sl: "Dvoboji" },
  },
];

interface DesktopNavigationProps {
  locale: string;
  pathname: string;
}

export function DesktopNavigation({ locale, pathname }: DesktopNavigationProps) {
  return (
    <nav className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-2 py-1.5">
      {navItems.map((item) => {
        const href = `/${locale}${item.route}`;
        const isActive =
          item.route === "/guesser"
            ? pathname === href || pathname === `${href}/`
            : pathname?.startsWith(href);
        const label =
          item.labels[locale as keyof typeof item.labels] || item.labels.de;
        const Icon = item.icon;

        return (
          <Link
            key={item.route}
            href={href}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium flex items-center gap-2 transition-all duration-200",
              isActive
                ? "bg-primary/15 text-primary text-glow-primary"
                : "text-text-secondary hover:bg-white/10 hover:text-text-primary"
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
