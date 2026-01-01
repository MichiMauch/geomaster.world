"use client";

import { NextIntlClientProvider, AbstractIntlMessages } from "next-intl";
import { useSession } from "next-auth/react";
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
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  return (
    <NextIntlClientProvider messages={messages} locale={locale} timeZone={timeZone}>
      <PageTitleProvider>
        <CursorGlow />
        {isAuthenticated && <Header />}
        <div className="flex-1">{children}</div>
        <Footer />
      </PageTitleProvider>
    </NextIntlClientProvider>
  );
}
