"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { NewsCard } from "@/components/news/NewsCard";
import { Newspaper } from "lucide-react";
import MissionControlBackground from "@/components/MissionControlBackground";

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

export default function NewsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch("/api/news", {
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

  const pageTitle = locale === "de" ? "News & Ankündigungen" : "News & Announcements";
  const pageSubtitle = locale === "de"
    ? "Bleib auf dem Laufenden mit den neuesten Updates von GeoMaster"
    : "Stay up to date with the latest updates from GeoMaster";
  const noNewsText = locale === "de" ? "Noch keine News vorhanden" : "No news yet";

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: 'url("/images/hero-map-bg.jpg")',
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-transparent" />
        <MissionControlBackground />
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Newspaper className="w-4 h-4" />
            <span className="text-sm font-medium">News</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {pageTitle}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {pageSubtitle}
          </p>
        </div>

        {/* News Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary">{noNewsText}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item) => (
              <NewsCard
                key={item.id}
                news={getLocalizedNews(item)}
                locale={locale}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
