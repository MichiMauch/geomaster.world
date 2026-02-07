import { memo } from "react";
import { Bell, Swords, Sparkles, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NotificationData, NewsItem } from "./notification-constants";
import { formatTimeAgo, stripHtml } from "./notification-constants";

function getNotificationIcon(type: string) {
  if (type === "duel_completed") {
    return <Swords className="w-4 h-4 text-accent" />;
  }
  if (type === "duel_challenge_received") {
    return <UserPlus className="w-4 h-4 text-primary" />;
  }
  return <Bell className="w-4 h-4 text-primary" />;
}

interface NotificationItemProps {
  item: NotificationData;
  locale: string;
  onClick: (item: NotificationData) => void;
}

export const NotificationItem = memo(function NotificationItem({ item, locale, onClick }: NotificationItemProps) {
  const isUnread = !item.isRead;
  return (
    <button
      onClick={() => onClick(item)}
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
});

interface NewsItemProps {
  item: NewsItem;
  locale: string;
  isSeen: boolean;
  onClick: (item: NewsItem) => void;
}

export const NewsFeedItem = memo(function NewsFeedItem({ item, locale, isSeen, onClick }: NewsItemProps) {
  const isUnseen = !isSeen;
  const localizedTitle = locale === "en" && item.titleEn ? item.titleEn : item.title;
  const localizedContent = locale === "en" && item.contentEn ? item.contentEn : item.content;
  return (
    <button
      onClick={() => onClick(item)}
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
});
