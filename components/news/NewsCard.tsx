"use client";

import { Card } from "@/components/ui/Card";
import { ArrowRight, Calendar } from "lucide-react";

interface NewsCardProps {
  news: {
    id: string;
    title: string;
    content: string;
    link?: string | null;
    linkText?: string | null;
    createdAt: Date | string | number;
  };
  locale: string;
  onReadMore: () => void;
}

export function NewsCard({ news, locale, onReadMore }: NewsCardProps) {
  const formatDate = (date: Date | string | number) => {
    const d = new Date(date);
    return d.toLocaleDateString(locale === "de" ? "de-CH" : locale === "sl" ? "sl-SI" : "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const readMoreText = locale === "de" ? "Mehr lesen" : locale === "sl" ? "Preberi vec" : "Read more";

  return (
    <Card variant="glass" padding="md" className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Calendar className="w-4 h-4" />
        <span>{formatDate(news.createdAt)}</span>
      </div>

      <h3 className="text-lg font-semibold text-text-primary">
        {news.title}
      </h3>

      <button
        onClick={onReadMore}
        className="inline-flex items-center gap-1.5 text-primary hover:underline text-sm font-medium mt-1 self-start"
      >
        {readMoreText}
        <ArrowRight className="w-4 h-4" />
      </button>
    </Card>
  );
}
