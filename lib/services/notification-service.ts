import { db } from "@/lib/db";
import { notifications, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDisplayName } from "@/lib/utils";

export type NotificationType = "duel_completed" | "duel_challenge_received";

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

export interface GetNotificationsParams {
  userId: string;
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}

export interface NotificationWithMeta {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: Date;
}

export interface DuelCompletedNotificationParams {
  challengerId: string;
  accepterName: string;
  duelId: string;
  winnerId: string;
  gameType: string;
  locale?: string;
}

const translations = {
  de: {
    duelCompletedTitle: "Duell abgeschlossen!",
    duelCompletedWon: (accepterName: string) => `${accepterName} hat dein Duell angenommen - du hast gewonnen!`,
    duelCompletedLost: (accepterName: string) => `${accepterName} hat dein Duell angenommen und gewonnen.`,
  },
  en: {
    duelCompletedTitle: "Duel completed!",
    duelCompletedWon: (accepterName: string) => `${accepterName} accepted your duel - you won!`,
    duelCompletedLost: (accepterName: string) => `${accepterName} accepted your duel and won.`,
  },
  sl: {
    duelCompletedTitle: "Dvoboj zaključen!",
    duelCompletedWon: (accepterName: string) => `${accepterName} je sprejel tvoj dvoboj - zmagal si!`,
    duelCompletedLost: (accepterName: string) => `${accepterName} je sprejel tvoj dvoboj in zmagal.`,
  },
};

export class NotificationService {
  /**
   * Create a notification for a user
   */
  static async create(params: CreateNotificationParams): Promise<string> {
    const { userId, type, title, message, link, metadata } = params;

    const id = nanoid();
    const now = new Date();

    await db.insert(notifications).values({
      id,
      userId,
      type,
      title,
      message,
      link: link || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
      isRead: false,
      createdAt: now,
    });

    return id;
  }

  /**
   * Get notifications for a user (with pagination and filtering)
   */
  static async getForUser(params: GetNotificationsParams): Promise<NotificationWithMeta[]> {
    const { userId, limit = 20, offset = 0, unreadOnly = false } = params;

    const conditions = unreadOnly
      ? and(eq(notifications.userId, userId), eq(notifications.isRead, false))
      : eq(notifications.userId, userId);

    const results = await db
      .select()
      .from(notifications)
      .where(conditions)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map((n) => ({
      ...n,
      metadata: n.metadata ? JSON.parse(n.metadata) : null,
    }));
  }

  /**
   * Get unread count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const results = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    return results.length;
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<number> {
    // Count unread first
    const unread = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    if (unread.length === 0) return 0;

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    return unread.length;
  }

  /**
   * Delete old notifications (cleanup job)
   */
  static async deleteOlderThan(days: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    // SQLite doesn't support < with timestamps directly, so we compare as numbers
    const results = await db.select().from(notifications);
    const toDelete = results.filter((n) => n.createdAt < cutoff);

    for (const notification of toDelete) {
      await db.delete(notifications).where(eq(notifications.id, notification.id));
    }

    return toDelete.length;
  }

  /**
   * Create duel completion notification for challenger
   */
  static async notifyDuelCompleted(params: DuelCompletedNotificationParams): Promise<string> {
    const { challengerId, accepterName, duelId, winnerId, gameType, locale = "de" } = params;

    const t = translations[locale as keyof typeof translations] || translations.de;
    const challengerWon = winnerId === challengerId;

    const title = t.duelCompletedTitle;
    const message = challengerWon ? t.duelCompletedWon(accepterName) : t.duelCompletedLost(accepterName);

    return this.create({
      userId: challengerId,
      type: "duel_completed",
      title,
      message,
      link: `/${locale}/guesser/duel/results/${duelId}`,
      metadata: {
        duelId,
        accepterName,
        winnerId,
        gameType,
        challengerWon,
      },
    });
  }
}
