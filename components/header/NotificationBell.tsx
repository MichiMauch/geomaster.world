"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks/useClickOutside";
import { NewsDetailModal } from "@/components/news/NewsDetailModal";
import { NotificationItem, NewsFeedItem } from "./NotificationFeedItem";
import {
  type NotificationData,
  type NewsItem,
  type FeedItem,
  labels,
  SEEN_NEWS_STORAGE_KEY,
} from "./notification-constants";

interface NotificationBellProps {
  locale: string;
}

export function NotificationBell({ locale }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [seenNewsIds, setSeenNewsIds] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const t = labels[locale as keyof typeof labels] || labels.de;

  const closeDropdown = useCallback(() => setIsOpen(false), []);
  useClickOutside(dropdownRef, closeDropdown);

  // Load seen news IDs from localStorage on mount
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(SEEN_NEWS_STORAGE_KEY);
      if (dismissed) {
        setSeenNewsIds(new Set(JSON.parse(dismissed)));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [notifRes, newsRes] = await Promise.all([
        fetch("/api/notifications?limit=10"),
        fetch("/api/news?limit=5", { cache: "no-store" }),
      ]);

      if (notifRes.ok) {
        const data = await notifRes.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }

      if (newsRes.ok) {
        const newsData = await newsRes.json();
        setNews(newsData);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  }, []);

  // Combine notifications and news into a single sorted feed
  const feedItems = useMemo((): FeedItem[] => {
    const items: FeedItem[] = [
      ...notifications.map((n) => ({ ...n, itemType: "notification" as const })),
      ...news.map((n) => ({ ...n, itemType: "news" as const })),
    ];
    return items
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [notifications, news]);

  // Combined unread count: unread notifications + unseen news
  const combinedUnreadCount = useMemo(() => {
    const unseenNewsCount = news.filter((n) => !seenNewsIds.has(n.id)).length;
    return unreadCount + unseenNewsCount;
  }, [unreadCount, news, seenNewsIds]);

  // Initial fetch and polling
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Refetch when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchData().finally(() => setLoading(false));
    }
  }, [isOpen, fetchData]);

  const handleNotificationClick = async (notification: NotificationData) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    fetch(`/api/notifications/${notification.id}/read`, { method: "POST" }).catch(
      console.error
    );

    if (notification.link) {
      router.push(notification.link);
    }

    closeDropdown();
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    const allNewsIds = news.map((n) => n.id);
    const newSeenIds = new Set([...Array.from(seenNewsIds), ...allNewsIds]);
    setSeenNewsIds(newSeenIds);
    try {
      localStorage.setItem(
        SEEN_NEWS_STORAGE_KEY,
        JSON.stringify(Array.from(newSeenIds).slice(-20))
      );
    } catch {
      // Ignore localStorage errors
    }

    try {
      await fetch("/api/notifications", { method: "POST" });
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      fetchData();
    }
  };

  const handleNewsClick = (newsItem: NewsItem) => {
    const newSeenIds = new Set([...Array.from(seenNewsIds), newsItem.id]);
    setSeenNewsIds(newSeenIds);
    try {
      localStorage.setItem(
        SEEN_NEWS_STORAGE_KEY,
        JSON.stringify(Array.from(newSeenIds).slice(-20))
      );
    } catch {
      // Ignore localStorage errors
    }

    setSelectedNews(newsItem);
    closeDropdown();
  };

  const getLocalizedNews = (newsItem: NewsItem) => ({
    id: newsItem.id,
    title: locale === "en" && newsItem.titleEn ? newsItem.titleEn : newsItem.title,
    content: locale === "en" && newsItem.contentEn ? newsItem.contentEn : newsItem.content,
    link: newsItem.link,
    linkText: locale === "en" && newsItem.linkTextEn ? newsItem.linkTextEn : newsItem.linkText,
  });

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Bell Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "relative p-2 rounded-lg transition-colors",
            "hover:bg-surface-2",
            isOpen && "bg-surface-2"
          )}
          aria-label={t.title}
        >
          <Bell className="w-5 h-5 text-text-secondary" />
          {combinedUnreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-error rounded-full flex items-center justify-center text-[10px] font-bold text-white">
              {combinedUnreadCount > 9 ? "9+" : combinedUnreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="fixed left-1/2 -translate-x-1/2 top-16 w-80 max-w-[calc(100vw-1rem)] sm:absolute sm:right-0 sm:left-auto sm:top-auto sm:translate-x-0 mt-2 bg-surface-2 border border-glass-border rounded-xl shadow-lg animate-fade-in overflow-hidden z-50">
            {/* Header */}
            <div className="px-4 py-3 border-b border-glass-border flex items-center justify-between">
              <h3 className="font-semibold text-text-primary">{t.title}</h3>
              {combinedUnreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary hover:text-primary-light flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  {t.markAllRead}
                </button>
              )}
            </div>

            {/* Feed List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-8 text-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : feedItems.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-text-muted">{t.empty}</p>
                </div>
              ) : (
                feedItems.map((item) =>
                  item.itemType === "notification" ? (
                    <NotificationItem
                      key={`notification-${item.id}`}
                      item={item}
                      locale={locale}
                      onClick={handleNotificationClick}
                    />
                  ) : (
                    <NewsFeedItem
                      key={`news-${item.id}`}
                      item={item}
                      locale={locale}
                      isSeen={seenNewsIds.has(item.id)}
                      onClick={handleNewsClick}
                    />
                  )
                )
              )}
            </div>

            {/* Footer */}
            {news.length > 0 && (
              <div className="px-4 py-2 border-t border-glass-border">
                <Link
                  href={`/${locale}/news`}
                  onClick={closeDropdown}
                  className="text-sm text-primary hover:text-primary-light hover:underline"
                >
                  {t.showAllNews} →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* News Detail Modal */}
      {selectedNews && (
        <NewsDetailModal
          news={getLocalizedNews(selectedNews)}
          locale={locale}
          onClose={() => setSelectedNews(null)}
        />
      )}
    </>
  );
}
