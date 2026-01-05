"use client";

import { NextIntlClientProvider, AbstractIntlMessages } from "next-intl";
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CursorGlow } from "./CursorGlow";
import { PageTitleProvider } from "@/contexts/PageTitleContext";

interface LocaleProvidersProps {
  children: React.ReactNode;
  messages: AbstractIntlMessages;
  locale: string;
  timeZone?: string;
}

export function LocaleProviders({ children, messages, locale, timeZone }: LocaleProvidersProps) {
  const pathname = usePathname();

  // Hide header and footer on game play page for immersive experience
  const isPlayPage = pathname?.includes("/guesser/play/");
  const showHeader = !isPlayPage;
  const showFooter = !isPlayPage;

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
