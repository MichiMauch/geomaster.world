"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Home, Trophy, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    icon: Home,
    route: "/guesser",
    labels: { de: "Home", en: "Home", sl: "Domov" },
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

export function MobileBottomNavigation() {
  const params = useParams();
  const pathname = usePathname();
  const locale = (params.locale as string) || "de";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-surface-1/95 backdrop-blur-xl border-t border-glass-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16">
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
                "flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-2 transition-colors",
                isActive
                  ? "text-primary text-glow-primary"
                  : "text-text-muted"
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
