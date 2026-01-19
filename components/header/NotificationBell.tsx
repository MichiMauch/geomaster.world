"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Swords, Check, Sparkles, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks/useClickOutside";
import { NewsDetailModal } from "@/components/news/NewsDetailModal";

interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
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

interface NotificationBellProps {
  locale: string;
}

const SEEN_NEWS_STORAGE_KEY = "geomaster-dismissed-news";

const labels = {
  de: {
    title: "Benachrichtigungen",
    empty: "Keine neuen Benachrichtigungen",
    markAllRead: "Alle als gelesen markieren",
    showAllNews: "Alle News anzeigen",
    justNow: "Gerade eben",
    minutesAgo: (n: number) => `vor ${n} Min.`,
    hoursAgo: (n: number) => `vor ${n} Std.`,
    daysAgo: (n: number) => `vor ${n} Tagen`,
  },
  en: {
    title: "Notifications",
    empty: "No new notifications",
    markAllRead: "Mark all as read",
    showAllNews: "Show all news",
    justNow: "Just now",
    minutesAgo: (n: number) => `${n}m ago`,
    hoursAgo: (n: number) => `${n}h ago`,
    daysAgo: (n: number) => `${n}d ago`,
  },
  sl: {
    title: "Obvestila",
    empty: "Ni novih obvestil",
    markAllRead: "Označi vse kot prebrano",
    showAllNews: "Pokaži vse novice",
    justNow: "Pravkar",
    minutesAgo: (n: number) => `pred ${n} min`,
    hoursAgo: (n: number) => `pred ${n} urami`,
    daysAgo: (n: number) => `pred ${n} dnevi`,
  },
};

function formatTimeAgo(date: string, locale: string): string {
  const t = labels[locale as keyof typeof labels] || labels.de;
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return t.justNow;
  if (diffMinutes < 60) return t.minutesAgo(diffMinutes);
  if (diffHours < 24) return t.hoursAgo(diffHours);
  return t.daysAgo(diffDays);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

type FeedItem =
  | (NotificationData & { itemType: "notification" })
  | (NewsItem & { itemType: "news" });

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
    // Poll every 30 seconds
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
    // Mark as read (optimistic)
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    // API call (fire and forget)
    fetch(`/api/notifications/${notification.id}/read`, { method: "POST" }).catch(
      console.error
    );

    // Navigate to link
    if (notification.link) {
      router.push(notification.link);
    }

    closeDropdown();
  };

  const handleMarkAllRead = async () => {
    // Optimistic update for notifications
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    // Mark all news as seen
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

    // API call for notifications
    try {
      await fetch("/api/notifications", { method: "POST" });
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      // Refetch on error
      fetchData();
    }
  };

  const handleNewsClick = (newsItem: NewsItem) => {
    // Mark as seen
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

    // Open modal
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

  const getNotificationIcon = (type: string) => {
    if (type === "duel_completed") {
      return <Swords className="w-4 h-4 text-accent" />;
    }
    if (type === "duel_challenge_received") {
      return <UserPlus className="w-4 h-4 text-primary" />;
    }
    return <Bell className="w-4 h-4 text-primary" />;
  };

  const renderNotificationItem = (item: NotificationData & { itemType: "notification" }) => {
    const isUnread = !item.isRead;
    return (
      <button
        key={`notification-${item.id}`}
        onClick={() => handleNotificationClick(item)}
        className={cn(
          "w-full px-4 py-3 text-left hover:bg-surface-3 transition-colors border-b border-glass-border last:border-b-0",
          isUnread && "bg-primary/5"
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              isUnread ? "bg-primary/20" : "bg-surface-3"
            )}
          >
            {getNotificationIcon(item.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-sm",
                isUnread ? "font-semibold text-text-primary" : "font-medium text-text-secondary"
              )}
            >
              {item.title}
            </p>
            <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{item.message}</p>
            <p className="text-xs text-text-muted mt-1 opacity-70">
              {formatTimeAgo(item.createdAt, locale)}
            </p>
          </div>
          {isUnread && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
        </div>
      </button>
    );
  };

  const renderNewsItem = (item: NewsItem & { itemType: "news" }) => {
    const isUnseen = !seenNewsIds.has(item.id);
    const localizedTitle = locale === "en" && item.titleEn ? item.titleEn : item.title;
    const localizedContent = locale === "en" && item.contentEn ? item.contentEn : item.content;
    return (
      <button
        key={`news-${item.id}`}
        onClick={() => handleNewsClick(item)}
        className={cn(
          "w-full px-4 py-3 text-left hover:bg-surface-3 transition-colors border-b border-glass-border last:border-b-0",
          isUnseen && "bg-gradient-to-r from-accent/5 to-transparent"
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              isUnseen ? "bg-accent/20" : "bg-surface-3"
            )}
          >
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-sm",
                isUnseen ? "font-semibold text-text-primary" : "font-medium text-text-secondary"
              )}
            >
              {localizedTitle}
            </p>
            <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
              {stripHtml(localizedContent).slice(0, 80)}
              {stripHtml(localizedContent).length > 80 ? "..." : ""}
            </p>
            <p className="text-xs text-text-muted mt-1 opacity-70">
              {formatTimeAgo(item.createdAt, locale)}
            </p>
          </div>
          {isUnseen && <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-2" />}
        </div>
      </button>
    );
  };

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

            {/* Feed List (Notifications + News) */}
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
                  item.itemType === "notification"
                    ? renderNotificationItem(item)
                    : renderNewsItem(item)
                )
              )}
            </div>

            {/* Footer with News Link */}
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
