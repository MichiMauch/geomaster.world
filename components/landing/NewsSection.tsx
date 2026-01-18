"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NewsCard } from "@/components/news/NewsCard";
import { NewsDetailModal } from "@/components/news/NewsDetailModal";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Newspaper } from "lucide-react";

interface NewsSectionProps {
  locale: string;
}

interface NewsItem {
  id: string;
  title: string;
  titleEn: string | null;
  content: string;
  contentEn: string | null;
  link: string | null;
  linkText: string | null;
  linkTextEn: string | null;
  createdAt: string;
}

export default function NewsSection({ locale }: NewsSectionProps) {
  const router = useRouter();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch("/api/news?limit=3", {
          cache: "no-store",
        });
        if (response.ok) {
          const data = await response.json();
          setNews(data || []);
        }
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // Get localized content
  const getLocalizedNews = (item: NewsItem) => ({
    id: item.id,
    title: locale === "en" ? (item.titleEn || item.title) : item.title,
    content: locale === "en" ? (item.contentEn || item.content) : item.content,
    link: item.link,
    linkText: locale === "en" ? (item.linkTextEn || item.linkText) : item.linkText,
    createdAt: item.createdAt,
  });

  // Don't render if no news
  if (!loading && news.length === 0) {
    return null;
  }

  const sectionTitle = locale === "de" ? "Neuigkeiten" : locale === "sl" ? "Novice" : "News";
  const sectionSubtitle = locale === "de"
    ? "Was gibt es Neues bei GeoMaster?"
    : locale === "sl"
    ? "Kaj je novega pri GeoMaster?"
    : "What's new at GeoMaster?";
  const viewAllText = locale === "de" ? "Alle News anzeigen" : locale === "sl" ? "Prikazi vse novice" : "View all news";

  return (
    <section className="py-16 md:py-20 bg-surface-1">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Newspaper className="w-4 h-4" />
            <span className="text-sm font-medium">{sectionTitle}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {sectionSubtitle}
          </h2>
        </div>

        {/* News Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {news.map((item) => (
                <NewsCard
                  key={item.id}
                  news={getLocalizedNews(item)}
                  locale={locale}
                  onReadMore={() => setSelectedNews(item)}
                />
              ))}
            </div>

            {/* View All Button */}
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => router.push(`/${locale}/news`)}
                className="group"
              >
                {viewAllText}
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </>
        )}
      </div>

      {selectedNews && (
        <NewsDetailModal
          news={getLocalizedNews(selectedNews)}
          locale={locale}
          onClose={() => setSelectedNews(null)}
        />
      )}
    </section>
  );
}
