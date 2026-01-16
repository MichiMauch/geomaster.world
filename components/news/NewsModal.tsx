"use client";

import { useState, useEffect } from "react";
import { X, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface NewsModalProps {
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

export function NewsModal({ news, locale }: NewsModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check localStorage on client
    const dismissed = localStorage.getItem(DISMISSED_NEWS_KEY);
    const dismissedIds: string[] = dismissed ? JSON.parse(dismissed) : [];
    // Show modal if this news hasn't been dismissed
    setIsVisible(!dismissedIds.includes(news.id));
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
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  const closeText = locale === "de" ? "Schliessen" : "Close";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-fade-in">
        <div className="rounded-xl bg-surface-1 border border-glass-border shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-surface-3 text-text-secondary hover:text-text-primary transition-colors"
              aria-label={closeText}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/20">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <span className="text-xs font-medium text-primary uppercase tracking-wide">
                  {locale === "de" ? "Neuigkeiten" : "News"}
                </span>
                <h2 className="text-lg font-bold text-text-primary mt-0.5">
                  {news.title}
                </h2>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <p className="text-text-secondary leading-relaxed">
              {news.content}
            </p>

            {news.link && (
              <Link
                href={news.link}
                target={news.link.startsWith("http") ? "_blank" : undefined}
                rel={news.link.startsWith("http") ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-1.5 text-primary hover:underline text-sm font-medium mt-4"
              >
                {news.linkText || (locale === "de" ? "Mehr erfahren" : "Learn more")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-2">
            <Button
              variant="primary"
              onClick={handleDismiss}
              className="w-full"
            >
              {closeText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
