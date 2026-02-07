export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export interface NewsItem {
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

export type FeedItem =
  | (NotificationData & { itemType: "notification" })
  | (NewsItem & { itemType: "news" });

export const SEEN_NEWS_STORAGE_KEY = "geomaster-dismissed-news";

export const labels = {
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

export function formatTimeAgo(date: string, locale: string): string {
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

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}
