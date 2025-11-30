"use client";

import { NextIntlClientProvider, AbstractIntlMessages } from "next-intl";
import { Header } from "./Header";
import { CursorGlow } from "./CursorGlow";
import { PageTitleProvider } from "@/contexts/PageTitleContext";

interface LocaleProvidersProps {
  children: React.ReactNode;
  messages: AbstractIntlMessages;
  locale: string;
}

export function LocaleProviders({ children, messages, locale }: LocaleProvidersProps) {
  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <PageTitleProvider>
        <CursorGlow />
        <Header />
        {children}
      </PageTitleProvider>
    </NextIntlClientProvider>
  );
}
