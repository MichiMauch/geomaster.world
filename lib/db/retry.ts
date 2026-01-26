import { logger } from "@/lib/logger";

export interface RetryConfig {
  maxAttempts?: number; // Default: 3
  initialDelayMs?: number; // Default: 100ms
  maxDelayMs?: number; // Default: 10000ms
  backoffMultiplier?: number; // Default: 2
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("ECONNRESET") ||
      error.message.includes("socket") ||
      error.message.includes("connection") ||
      error.message.includes("timeout") ||
      error.message.includes("FetchError")
    );
  }
  return false;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 100,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
  } = config;

  let lastError: unknown;
  let currentDelayMs = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error) || attempt === maxAttempts) {
        throw error;
      }

      logger.warn(`DB operation "${operationName}" failed, retry ${attempt}/${maxAttempts}`, {
        error: error instanceof Error ? error.message : String(error),
        delayMs: currentDelayMs,
      });

      await new Promise((resolve) => setTimeout(resolve, currentDelayMs));

      const jitter = Math.random() * 0.1 * currentDelayMs;
      currentDelayMs = Math.min(maxDelayMs, currentDelayMs * backoffMultiplier + jitter);
    }
  }

  throw lastError;
}
