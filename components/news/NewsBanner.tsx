"use client";

import { useState, useEffect } from "react";
import { X, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

interface NewsBannerProps {
  news: {
    id: string;
    title: string;
    content: string;
    link?: string | null;
    linkText?: string | null;
  };
  locale: string;
}

const DISMISSED_NEWS_KEY = "geomaster-dismissed-news";

export function NewsBanner({ news, locale }: NewsBannerProps) {
  const [isDismissed, setIsDismissed] = useState(true); // Start hidden to avoid flash

  useEffect(() => {
    // Check localStorage on client
    const dismissed = localStorage.getItem(DISMISSED_NEWS_KEY);
    const dismissedIds: string[] = dismissed ? JSON.parse(dismissed) : [];
    setIsDismissed(dismissedIds.includes(news.id));
  }, [news.id]);

  const handleDismiss = () => {
    const dismissed = localStorage.getItem(DISMISSED_NEWS_KEY);
    const dismissedIds: string[] = dismissed ? JSON.parse(dismissed) : [];
    if (!dismissedIds.includes(news.id)) {
      dismissedIds.push(news.id);
      // Keep only last 10 dismissed IDs
      const trimmed = dismissedIds.slice(-10);
      localStorage.setItem(DISMISSED_NEWS_KEY, JSON.stringify(trimmed));
    }
    setIsDismissed(true);
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 backdrop-blur-sm">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 p-2 rounded-lg bg-primary/20">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-primary mb-1">{news.title}</h3>
          <div
            className="text-sm text-text-secondary line-clamp-2 [&_p]:inline [&_h2]:inline [&_h3]:inline [&_ul]:inline [&_ol]:inline [&_li]:inline [&_blockquote]:inline [&_strong]:font-semibold [&_em]:italic [&_code]:text-primary"
            dangerouslySetInnerHTML={{ __html: news.content }}
          />

          {news.link && (
            <Link
              href={news.link}
              target={news.link.startsWith("http") ? "_blank" : undefined}
              rel={news.link.startsWith("http") ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-1 text-primary hover:underline text-sm font-medium mt-2"
            >
              {news.linkText || (locale === "de" ? "Mehr erfahren" : locale === "sl" ? "Več" : "Learn more")}
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-surface-3 text-text-secondary hover:text-text-primary transition-colors"
          aria-label={locale === "de" ? "Schliessen" : locale === "sl" ? "Zapri" : "Close"}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
