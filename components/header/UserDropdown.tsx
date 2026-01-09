"use client";

import { useState, useRef, useCallback } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks/useClickOutside";

interface UserDropdownProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    isSuperAdmin?: boolean | null;
  };
  locale: string;
}

export function UserDropdown({ user, locale }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("header");
  const tCommon = useTranslations("common");

  const closeDropdown = useCallback(() => setIsOpen(false), []);
  useClickOutside(dropdownRef, closeDropdown);

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

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
        {/* Avatar */}
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
        {/* Name (hidden on mobile) */}
        <span className="hidden sm:block text-sm text-text-secondary max-w-[120px] truncate">
          {user.name}
        </span>
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
        <div className="absolute right-0 mt-2 w-48 py-1 bg-surface-2 border border-glass-border rounded-lg shadow-lg animate-fade-in">
          {/* User Email */}
          <div className="px-4 py-2 border-b border-glass-border">
            <p className="text-xs text-text-muted truncate">{user.email}</p>
          </div>

          {/* Menu Items */}
          <Link
            href={`/${locale}/profile`}
            onClick={closeDropdown}
            className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t("profile")}
          </Link>

          {user.isSuperAdmin && (
            <>
              <Link
                href={`/${locale}/admin`}
                onClick={closeDropdown}
                className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {tCommon("admin")}
              </Link>
              <Link
                href={`/${locale}/styleguide`}
                onClick={closeDropdown}
                className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                Styleguide
              </Link>
            </>
          )}

          <button
            onClick={() => {
              closeDropdown();
              signOut({ callbackUrl: `/${locale}` });
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-surface-3 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {t("logout")}
          </button>
        </div>
      )}
    </div>
  );
}
