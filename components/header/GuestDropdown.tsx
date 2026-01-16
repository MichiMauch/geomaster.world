"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks/useClickOutside";
import { Newspaper } from "lucide-react";

interface GuestDropdownProps {
  locale: string;
}

export function GuestDropdown({ locale }: GuestDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("header");

  const closeDropdown = useCallback(() => setIsOpen(false), []);
  useClickOutside(dropdownRef, closeDropdown);

  const guestText = locale === "de"
    ? "Du spielst als Gast"
    : locale === "sl"
    ? "Igraš kot gost"
    : "You're playing as a guest";

  const saveResultsText = locale === "de"
    ? "Melde dich an, um deine Ergebnisse zu speichern"
    : locale === "sl"
    ? "Prijavi se, da shraniš rezultate"
    : "Sign in to save your results";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors",
          "hover:bg-surface-2",
          isOpen && "bg-surface-2"
        )}
      >
        {/* Anonymous Avatar */}
        <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center text-text-secondary text-sm font-bold">
          A
        </div>
        {/* Dropdown Arrow */}
        <svg
          className={cn(
            "w-4 h-4 text-text-muted transition-transform",
            isOpen && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 py-1 bg-surface-2 border border-glass-border rounded-lg shadow-lg animate-fade-in">
          {/* Guest Info */}
          <div className="px-4 py-3 border-b border-glass-border">
            <p className="text-sm text-text-secondary">{guestText}</p>
            <p className="text-xs text-text-muted mt-1">{saveResultsText}</p>
          </div>

          {/* News Link */}
          <Link
            href={`/${locale}/news`}
            onClick={closeDropdown}
            className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors"
          >
            <Newspaper className="w-4 h-4" />
            {t("news")}
          </Link>

          {/* Login Button */}
          <Link
            href={`/${locale}/register`}
            onClick={closeDropdown}
            className="flex items-center gap-2 px-4 py-2 text-sm text-primary hover:text-primary-light hover:bg-surface-3 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            {t("login")}
          </Link>
        </div>
      )}
    </div>
  );
}
