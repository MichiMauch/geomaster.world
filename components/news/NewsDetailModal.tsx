"use client";

import { X, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface NewsDetailModalProps {
  news: {
    id: string;
    title: string;
    content: string;
    link?: string | null;
    linkText?: string | null;
  };
  locale: string;
  onClose: () => void;
}

export function NewsDetailModal({ news, locale, onClose }: NewsDetailModalProps) {
  const closeText = locale === "de" ? "Schliessen" : locale === "sl" ? "Zapri" : "Close";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md max-h-[80vh] animate-fade-in">
        <div className="rounded-xl bg-surface-1 border border-glass-border shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-surface-3 text-text-secondary hover:text-text-primary transition-colors"
              aria-label={closeText}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/20">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div className="pr-8">
                <span className="text-xs font-medium text-primary uppercase tracking-wide">
                  {locale === "de" ? "Neuigkeiten" : locale === "sl" ? "Novice" : "News"}
                </span>
                <h2 className="text-lg font-bold text-text-primary mt-0.5">
                  {news.title}
                </h2>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 overflow-y-auto">
            <div
              className="text-text-secondary leading-relaxed prose prose-invert max-w-none
                [&_p]:my-2
                [&_strong]:font-semibold [&_strong]:text-text-primary
                [&_em]:italic
                [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-text-primary [&_h2]:mt-3 [&_h2]:mb-1
                [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-text-primary [&_h3]:mt-2 [&_h3]:mb-1
                [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
                [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
                [&_li]:my-1
                [&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-3 [&_blockquote]:italic
                [&_code]:bg-surface-3 [&_code]:px-1 [&_code]:rounded [&_code]:text-primary [&_code]:text-sm
                [&_pre]:bg-surface-3 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:my-2 [&_pre]:overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: news.content }}
            />

            {news.link && (
              <Link
                href={news.link}
                target={news.link.startsWith("http") ? "_blank" : undefined}
                rel={news.link.startsWith("http") ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-1.5 text-primary hover:underline text-sm font-medium mt-4"
              >
                {news.linkText || (locale === "de" ? "Mehr erfahren" : locale === "sl" ? "Vec" : "Learn more")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-2 shrink-0">
            <Button
              variant="primary"
              onClick={onClose}
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
