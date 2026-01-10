import { logger } from "@/lib/logger";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileVerificationResult {
  success: boolean;
  errorCodes?: string[];
  challenge_ts?: string;
  hostname?: string;
}

/**
 * Verify Cloudflare Turnstile token server-side
 */
export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string
): Promise<TurnstileVerificationResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    logger.error("TURNSTILE_SECRET_KEY not configured");
    // In development without key, allow through (for testing)
    if (process.env.NODE_ENV === "development") {
      logger.warn("Turnstile bypass in development mode");
      return { success: true };
    }
    return { success: false, errorCodes: ["missing-secret-key"] };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const data = await response.json();

    return {
      success: data.success === true,
      errorCodes: data["error-codes"] || [],
      challenge_ts: data.challenge_ts,
      hostname: data.hostname,
    };
  } catch (error) {
    logger.error("Turnstile verification error", error);
    return { success: false, errorCodes: ["network-error"] };
  }
}
