/**
 * Centralized Logger Service for GeoMaster World
 *
 * Features:
 * - Log levels: debug < info < warn < error
 * - Environment-aware: verbose in dev, minimal in prod
 * - Structured logging with context support
 * - Colored output in development
 * - JSON output in production
 */

type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  userId?: string;
  gameId?: string;
  groupId?: string;
  requestId?: string;
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// ANSI color codes for terminal output
const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  blue: "\x1b[34m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: COLORS.dim,
  info: COLORS.blue,
  warn: COLORS.yellow,
  error: COLORS.red,
};

const LEVEL_LABELS: Record<LogLevel, string> = {
  debug: "DEBUG",
  info: "INFO",
  warn: "WARN",
  error: "ERROR",
};

// Determine current log level from environment
function getCurrentLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL as LogLevel | undefined;
  if (envLevel && LOG_LEVELS[envLevel] !== undefined) {
    return envLevel;
  }
  // Default: debug in development, warn in production
  return process.env.NODE_ENV === "production" ? "warn" : "debug";
}

const currentLevel = getCurrentLogLevel();
const isDev = process.env.NODE_ENV !== "production";

// Check if a log level should be output
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

// Format context for output
function formatContext(context?: LogContext): string {
  if (!context || Object.keys(context).length === 0) return "";

  if (isDev) {
    // Colored, readable format for development
    const parts = Object.entries(context)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${COLORS.cyan}${k}${COLORS.reset}=${JSON.stringify(v)}`);
    return parts.length > 0 ? ` ${parts.join(" ")}` : "";
  }

  // JSON format for production
  return ` ${JSON.stringify(context)}`;
}

// Extract error information
function formatError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }
  if (typeof error === "string") {
    return { message: error };
  }
  return { message: String(error) };
}

// Format timestamp
function getTimestamp(): string {
  if (isDev) {
    // Short time format for development
    return new Date().toLocaleTimeString("de-CH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
  // ISO format for production (better for log parsing)
  return new Date().toISOString();
}

// Main log function
function log(level: LogLevel, message: string, context?: LogContext): void {
  if (!shouldLog(level)) return;

  const timestamp = getTimestamp();
  const contextStr = formatContext(context);

  if (isDev) {
    // Colored output for development
    const color = LEVEL_COLORS[level];
    const label = LEVEL_LABELS[level];
    const consoleFn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;

    consoleFn(
      `${COLORS.dim}${timestamp}${COLORS.reset} ${color}[${label}]${COLORS.reset} ${message}${contextStr}`
    );
  } else {
    // JSON output for production
    const logEntry = {
      timestamp,
      level,
      message,
      ...(context && Object.keys(context).length > 0 ? { context } : {}),
    };

    const consoleFn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    consoleFn(JSON.stringify(logEntry));
  }
}

// Error log with error object handling
function logError(message: string, error?: unknown, context?: LogContext): void {
  if (!shouldLog("error")) return;

  const timestamp = getTimestamp();
  const errorInfo = error ? formatError(error) : null;
  const contextStr = formatContext(context);

  if (isDev) {
    // Colored output for development
    console.error(
      `${COLORS.dim}${timestamp}${COLORS.reset} ${COLORS.red}[ERROR]${COLORS.reset} ${message}${contextStr}`
    );
    if (errorInfo) {
      console.error(`${COLORS.red}  → ${errorInfo.message}${COLORS.reset}`);
      if (errorInfo.stack) {
        console.error(`${COLORS.dim}${errorInfo.stack}${COLORS.reset}`);
      }
    }
  } else {
    // JSON output for production
    const logEntry = {
      timestamp,
      level: "error",
      message,
      ...(errorInfo ? { error: errorInfo } : {}),
      ...(context && Object.keys(context).length > 0 ? { context } : {}),
    };
    console.error(JSON.stringify(logEntry));
  }
}

/**
 * Logger instance with debug, info, warn, and error methods
 *
 * @example
 * // Simple usage
 * logger.info("User logged in");
 * logger.error("Failed to fetch data", error);
 *
 * // With context
 * logger.debug("Processing game", { gameId, userId });
 * logger.error("Game creation failed", error, { userId, gameType });
 */
export const logger = {
  /**
   * Debug level - only shown in development or when LOG_LEVEL=debug
   * Use for detailed debugging information
   */
  debug: (message: string, context?: LogContext) => log("debug", message, context),

  /**
   * Info level - general information about application state
   * Use for important state changes, successful operations
   */
  info: (message: string, context?: LogContext) => log("info", message, context),

  /**
   * Warn level - potentially problematic situations
   * Use for deprecated features, fallback behavior, recoverable errors
   */
  warn: (message: string, context?: LogContext) => log("warn", message, context),

  /**
   * Error level - error conditions that should be investigated
   * Use for exceptions, failed operations, unexpected states
   */
  error: (message: string, error?: unknown, context?: LogContext) => logError(message, error, context),
};

export default logger;
