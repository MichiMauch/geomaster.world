"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { usePageTitle } from "@/contexts/PageTitleContext";
import toast from "react-hot-toast";

export function Header() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = (params.locale as string) || "de";
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("header");
  const tCommon = useTranslations("common");
  const { pageTitle } = usePageTitle();

  // Scroll hide/show state
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Check if on home page
  const isHomePage = pathname === `/${locale}` || pathname === "/" || pathname === `/${locale}/`;

  // Check if on admin page
  const isAdminPage = pathname?.startsWith(`/${locale}/admin`);

  // Check if on guesser game type page (e.g., /de/guesser/country:switzerland)
  const isGuesserGamePage = pathname?.match(new RegExp(`^/${locale}/guesser/[^/]+$`));

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll hide/show logic
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        // Scrolling down & past threshold
        setIsHidden(true);
      } else {
        // Scrolling up
        setIsHidden(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Show profile prompt toast for users without a name
  useEffect(() => {
    if (status === "authenticated" && session?.user && !session.user.name) {
      const dismissed = localStorage.getItem("profilePromptDismissed");
      if (!dismissed) {
        toast(
          (toastInstance) => (
            <div className="flex items-center gap-3">
              <span>{t("profilePrompt")}</span>
              <Link
                href={`/${locale}/profile`}
                className="text-primary hover:text-primary-light underline whitespace-nowrap"
                onClick={() => toast.dismiss(toastInstance.id)}
              >
                {t("goToProfile")}
              </Link>
              <button
                onClick={() => {
                  localStorage.setItem("profilePromptDismissed", "true");
                  toast.dismiss(toastInstance.id);
                }}
                className="text-text-muted hover:text-text-primary ml-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ),
          { duration: 10000, id: "profile-prompt" }
        );
      }
    }
  }, [status, session, locale, t]);

  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-glass-border bg-surface-1/95 backdrop-blur-xl",
        "transition-transform duration-300",
        isHidden ? "-translate-y-full" : "translate-y-0"
      )}
    >
      <div className="max-w-[1440px] mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left side: Back button + Logo */}
        <div className="flex items-center gap-3">
          {/* Back Button - only show if not on home page */}
          {!isHomePage && (
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors p-1.5 -ml-1.5 rounded-lg hover:bg-surface-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Logo / Name */}
          <Link
            href={`/${locale}/guesser`}
            className="flex items-center gap-2 text-text-primary hover:text-primary transition-colors"
          >
            <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span className="text-lg font-bold tracking-tight">GeoMaster</span>
          </Link>

          {/* Link to Game Selection - only on guesser game pages */}
          {isGuesserGamePage && (
            <Link
              href={`/${locale}/guesser`}
              className="flex items-center gap-2 ml-4 pl-4 border-l border-glass-border text-text-secondary hover:text-primary transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="text-sm font-medium">
                {locale === "de" ? "Spiele" : locale === "en" ? "Games" : "Igre"}
              </span>
            </Link>
          )}

          {/* Page Title */}
          {(pageTitle || isAdminPage) && (
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-glass-border">
              <h1 className="text-lg font-semibold text-text-primary truncate max-w-[200px]">
                {pageTitle || "Admin Dashboard"}
              </h1>
            </div>
          )}
        </div>

        {/* Right side: User Info */}
        <div className="flex items-center gap-3">
          {status === "loading" ? (
            <div className="w-8 h-8 rounded-full bg-surface-2 animate-pulse" />
          ) : user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors",
                  "hover:bg-surface-2",
                  dropdownOpen && "bg-surface-2"
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
                    dropdownOpen && "rotate-180"
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 py-1 bg-surface-2 border border-glass-border rounded-lg shadow-lg animate-fade-in">
                  {/* User Email */}
                  <div className="px-4 py-2 border-b border-glass-border">
                    <p className="text-xs text-text-muted truncate">{user.email}</p>
                  </div>

                  {/* Menu Items */}
                  <Link
                    href={`/${locale}/profile`}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t("profile")}
                  </Link>

                  {session?.user?.isSuperAdmin && (
                    <>
                      <Link
                        href={`/${locale}/admin`}
                        onClick={() => setDropdownOpen(false)}
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
                        onClick={() => setDropdownOpen(false)}
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
                      setDropdownOpen(false);
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
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors",
                  "hover:bg-surface-2",
                  dropdownOpen && "bg-surface-2"
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
                    dropdownOpen && "rotate-180"
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 py-1 bg-surface-2 border border-glass-border rounded-lg shadow-lg animate-fade-in">
                  {/* Guest Info */}
                  <div className="px-4 py-3 border-b border-glass-border">
                    <p className="text-sm text-text-secondary">
                      {locale === "de" ? "Du spielst als Gast" : locale === "sl" ? "Igraš kot gost" : "You're playing as a guest"}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      {locale === "de" ? "Melde dich an, um deine Ergebnisse zu speichern" : locale === "sl" ? "Prijavi se, da shraniš rezultate" : "Sign in to save your results"}
                    </p>
                  </div>

                  {/* Login Button */}
                  <Link
                    href={`/${locale}/register`}
                    onClick={() => setDropdownOpen(false)}
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
          )}
        </div>
      </div>
    </header>
  );
}
