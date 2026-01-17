"use client";

import { Card } from "@/components/ui/Card";
import { ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";

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
}

export function NewsCard({ news, locale }: NewsCardProps) {
  const formatDate = (date: Date | string | number) => {
    const d = new Date(date);
    return d.toLocaleDateString(locale === "de" ? "de-CH" : locale === "sl" ? "sl-SI" : "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Card variant="glass" padding="lg" className="h-full flex flex-col">
      <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
        <Calendar className="w-4 h-4" />
        <span>{formatDate(news.createdAt)}</span>
      </div>

      <h3 className="text-lg font-semibold text-text-primary mb-2">
        {news.title}
      </h3>

      <div
        className="text-text-secondary text-sm flex-1 mb-4 line-clamp-3 [&_p]:inline [&_h2]:inline [&_h3]:inline [&_ul]:inline [&_ol]:inline [&_li]:inline [&_blockquote]:inline [&_strong]:font-semibold [&_em]:italic [&_code]:text-primary"
        dangerouslySetInnerHTML={{ __html: news.content }}
      />

      {news.link && (
        <Link
          href={news.link}
          target={news.link.startsWith("http") ? "_blank" : undefined}
          rel={news.link.startsWith("http") ? "noopener noreferrer" : undefined}
          className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium mt-auto"
        >
          {news.linkText || (locale === "de" ? "Mehr erfahren" : locale === "sl" ? "Več" : "Learn more")}
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </Card>
  );
}
