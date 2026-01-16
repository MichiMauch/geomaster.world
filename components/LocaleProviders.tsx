"use client";

import { useEffect } from "react";
import { NextIntlClientProvider, AbstractIntlMessages } from "next-intl";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CursorGlow } from "./CursorGlow";
import { PageTitleProvider } from "@/contexts/PageTitleContext";
import { checkAndClearCaches } from "@/lib/cache-buster";

interface LocaleProvidersProps {
  children: React.ReactNode;
  messages: AbstractIntlMessages;
  locale: string;
  timeZone?: string;
}

export function LocaleProviders({ children, messages, locale, timeZone }: LocaleProvidersProps) {
  const pathname = usePathname();
  const { status } = useSession();

  // Check and clear caches on version change (for mobile cache issues)
  useEffect(() => {
    checkAndClearCaches();
  }, []);

  // Hide header and footer on game play and results pages for immersive experience
  const isPlayPage = pathname?.includes("/guesser/play/");
  const isResultsPage = pathname?.includes("/guesser/results/");
  // Hide header on homepage for unauthenticated users (hero has its own layout)
  const isHomepage = pathname === `/${locale}` || pathname === `/${locale}/`;
  const isUnauthenticated = status === "unauthenticated";
  const showHeader = !isPlayPage && !isResultsPage && !(isHomepage && isUnauthenticated);
  const showFooter = !isPlayPage && !isResultsPage;

  return (
    <NextIntlClientProvider messages={messages} locale={locale} timeZone={timeZone}>
      <PageTitleProvider>
        <CursorGlow />
        {showHeader && <Header />}
        <div className="flex-1">{children}</div>
        {showFooter && <Footer />}
      </PageTitleProvider>
    </NextIntlClientProvider>
  );
}
