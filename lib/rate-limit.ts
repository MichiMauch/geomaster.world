import { db } from "@/lib/db";
import { registrationAttempts } from "@/lib/db/schema";
import { and, eq, gte, lt } from "drizzle-orm";
import { nanoid } from "nanoid";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 3;

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetAt: Date | null;
}

/**
 * Check if IP address is rate limited for registration
 */
export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

  // Count recent attempts (within window)
  const recentAttempts = await db
    .select()
    .from(registrationAttempts)
    .where(
      and(
        eq(registrationAttempts.ip, ip),
        gte(registrationAttempts.attemptedAt, windowStart)
      )
    )
    .orderBy(registrationAttempts.attemptedAt);

  const attemptCount = recentAttempts.length;
  const allowed = attemptCount < MAX_ATTEMPTS;

  let resetAt: Date | null = null;
  if (!allowed && recentAttempts.length > 0) {
    // Reset time is 15 min after the oldest attempt in the window
    resetAt = new Date(
      recentAttempts[0].attemptedAt.getTime() + RATE_LIMIT_WINDOW_MS
    );
  }

  return {
    allowed,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - attemptCount),
    resetAt,
  };
}

/**
 * Record a registration attempt
 */
export async function recordAttempt(
  ip: string,
  success: boolean
): Promise<void> {
  await db.insert(registrationAttempts).values({
    id: nanoid(),
    ip,
    attemptedAt: new Date(),
    success,
  });
}

/**
 * Cleanup old registration attempts (older than rate limit window)
 * Call this periodically via cron job
 */
export async function cleanupOldAttempts(): Promise<void> {
  const cutoff = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

  await db
    .delete(registrationAttempts)
    .where(lt(registrationAttempts.attemptedAt, cutoff));
}
