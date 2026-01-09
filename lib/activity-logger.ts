/**
 * Activity Logger Service for GeoMaster World
 *
 * Logs user activities, admin actions, game events, and system errors
 * to the database for display in the admin dashboard.
 *
 * Also outputs to the console logger for server-side visibility.
 */

import { db } from "@/lib/db";
import { activityLogs } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import { nanoid } from "nanoid";

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogCategory = "auth" | "game" | "admin" | "system";

export interface ActivityLogEntry {
  level: LogLevel;
  category: LogCategory;
  action: string;
  userId?: string | null;
  targetId?: string | null;
  targetType?: string | null;
  details?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Activity Logger class that writes to both database and console
 */
class ActivityLogger {
  /**
   * Write a log entry to the database
   */
  private async writeToDb(entry: ActivityLogEntry): Promise<void> {
    try {
      await db.insert(activityLogs).values({
        id: nanoid(),
        timestamp: new Date(),
        level: entry.level,
        category: entry.category,
        action: entry.action,
        userId: entry.userId || null,
        targetId: entry.targetId || null,
        targetType: entry.targetType || null,
        details: entry.details ? JSON.stringify(entry.details) : null,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      });
    } catch (error) {
      // Fallback to console if DB write fails - don't throw to avoid breaking the app
      logger.error("Failed to write activity log to database", error);
    }
  }

  /**
   * Log to both console and database
   */
  async log(entry: ActivityLogEntry): Promise<void> {
    // Console log for server visibility
    const consoleMessage = `[${entry.category.toUpperCase()}] ${entry.action}`;
    const context = {
      userId: entry.userId ?? undefined,
      targetId: entry.targetId ?? undefined,
      targetType: entry.targetType ?? undefined,
      ...entry.details,
    };

    switch (entry.level) {
      case "error":
        logger.error(consoleMessage, undefined, context);
        break;
      case "warn":
        logger.warn(consoleMessage, context);
        break;
      case "info":
        logger.info(consoleMessage, context);
        break;
      case "debug":
        logger.debug(consoleMessage, context);
        break;
    }

    // Database log for admin dashboard
    await this.writeToDb(entry);
  }

  // ============================================
  // Auth Events
  // ============================================

  /**
   * Log authentication events (login, logout, register, etc.)
   */
  async logAuth(
    action: string,
    userId: string | undefined | null,
    details?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      level: "info",
      category: "auth",
      action: `auth.${action}`,
      userId,
      details,
    });
  }

  // ============================================
  // Game Events
  // ============================================

  /**
   * Log game events (started, completed, highscore)
   */
  async logGame(
    action: string,
    userId: string | undefined | null,
    gameId: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      level: "info",
      category: "game",
      action: `game.${action}`,
      userId,
      targetId: gameId,
      targetType: "game",
      details,
    });
  }

  // ============================================
  // Admin Events
  // ============================================

  /**
   * Log admin actions (user deleted, settings changed, etc.)
   */
  async logAdmin(
    action: string,
    adminUserId: string,
    targetId: string,
    targetType: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      level: "warn", // Admin actions are important, use warn level
      category: "admin",
      action: `admin.${action}`,
      userId: adminUserId,
      targetId,
      targetType,
      details,
    });
  }

  // ============================================
  // System Events
  // ============================================

  /**
   * Log system events (errors, warnings)
   */
  async logSystem(
    level: LogLevel,
    action: string,
    error?: unknown,
    details?: Record<string, unknown>
  ): Promise<void> {
    const errorDetails =
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : error
          ? { raw: String(error) }
          : undefined;

    await this.log({
      level,
      category: "system",
      action: `system.${action}`,
      details: { ...details, error: errorDetails },
    });
  }

  /**
   * Convenience method for logging errors
   */
  async logError(
    action: string,
    error: unknown,
    details?: Record<string, unknown>
  ): Promise<void> {
    await this.logSystem("error", action, error, details);
  }

  /**
   * Convenience method for logging warnings
   */
  async logWarning(
    action: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    await this.logSystem("warn", action, undefined, details);
  }
}

// Export singleton instance
export const activityLogger = new ActivityLogger();
