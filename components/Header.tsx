"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { useScrollHide } from "@/hooks/useScrollHide";
import { UserDropdown } from "@/components/header/UserDropdown";
import { GuestDropdown } from "@/components/header/GuestDropdown";
import toast from "react-hot-toast";

export function Header() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = (params.locale as string) || "de";
  const t = useTranslations("header");
  const { pageTitle } = usePageTitle();

  // Use scroll hide hook
  const isHidden = useScrollHide({ threshold: 80 });

  // Check if on home page
  const isHomePage = pathname === `/${locale}` || pathname === "/" || pathname === `/${locale}/`;

  // Check if on admin page
  const isAdminPage = pathname?.startsWith(`/${locale}/admin`);

  // Check if on guesser game type page (e.g., /de/guesser/country:switzerland)
  const isGuesserGamePage = pathname?.match(new RegExp(`^/${locale}/guesser/[^/]+$`));

  // Check if on news page
  const isNewsPage = pathname === `/${locale}/news`;

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
            className="text-text-primary hover:text-primary transition-colors"
          >
            <span className="text-lg tracking-tight">
              <span className="font-extrabold">GeoMaster</span>
              <span className="font-light text-accent"> World</span>
            </span>
          </Link>

          {/* Link to Game Selection - on guesser game pages and news page */}
          {(isGuesserGamePage || isNewsPage) && (
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
            <UserDropdown
              user={{
                name: user.name,
                email: user.email,
                image: user.image,
                isSuperAdmin: user.isSuperAdmin,
              }}
              locale={locale}
            />
          ) : (
            <GuestDropdown locale={locale} />
          )}
        </div>
      </div>
    </header>
  );
}
