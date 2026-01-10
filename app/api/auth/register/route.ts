import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { activityLogger } from "@/lib/activity-logger";
import { users, verificationTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/email";
import { checkRateLimit, recordAttempt } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";

/**
 * Extract IP address from request headers
 */
function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(",")[0].trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  // Fallback (should not happen in production)
  return "unknown";
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  try {
    const body = await request.json();
    const {
      name,
      nickname,
      email,
      password,
      locale = "de",
      turnstileToken,
      website, // honeypot field
    } = body;

    // 1. HONEYPOT CHECK (silent fail - fools bots)
    if (website) {
      logger.warn("Honeypot triggered", { ip, email });
      await recordAttempt(ip, false);

      // Return fake success to fool bots
      return NextResponse.json(
        {
          success: true,
          requiresVerification: true,
        },
        { status: 201 }
      );
    }

    // 2. RATE LIMITING CHECK
    const rateLimitResult = await checkRateLimit(ip);

    if (!rateLimitResult.allowed) {
      logger.warn("Rate limit exceeded", { ip, email });

      return NextResponse.json(
        {
          error: "rate_limit_exceeded",
          resetAt: rateLimitResult.resetAt?.toISOString(),
        },
        { status: 429 }
      );
    }

    // 3. TURNSTILE VERIFICATION
    if (!turnstileToken) {
      return NextResponse.json({ error: "captcha_required" }, { status: 400 });
    }

    const turnstileResult = await verifyTurnstileToken(turnstileToken, ip);

    if (!turnstileResult.success) {
      logger.warn("Turnstile verification failed", {
        ip,
        email,
        errorCodes: turnstileResult.errorCodes,
      });

      await recordAttempt(ip, false);

      return NextResponse.json({ error: "captcha_failed" }, { status: 400 });
    }

    // 4. VALIDATE INPUT
    if (!name || !email || !password) {
      await recordAttempt(ip, false);
      return NextResponse.json(
        { error: "Name, E-Mail und Passwort sind erforderlich" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      await recordAttempt(ip, false);
      return NextResponse.json(
        { error: "Passwort muss mindestens 6 Zeichen lang sein" },
        { status: 400 }
      );
    }

    // 5. CHECK IF USER EXISTS
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      await recordAttempt(ip, false);
      return NextResponse.json(
        { error: "Diese E-Mail-Adresse ist bereits registriert" },
        { status: 409 }
      );
    }

    // 6. CREATE USER
    const hashedPassword = await hash(password, 12);

    const newUser = await db
      .insert(users)
      .values({
        name,
        nickname: nickname || null,
        email,
        password: hashedPassword,
      })
      .returning();

    // 7. GENERATE VERIFICATION TOKEN
    const token = nanoid(32);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.insert(verificationTokens).values({
      identifier: email,
      token,
      expires,
    });

    // 8. SEND VERIFICATION EMAIL
    await sendVerificationEmail(email, token, locale);

    // 9. LOG & RECORD SUCCESS
    await activityLogger.logAuth("register", newUser[0].id, { email, ip });
    await recordAttempt(ip, true);

    return NextResponse.json(
      {
        success: true,
        requiresVerification: true,
        user: {
          id: newUser[0].id,
          name: newUser[0].name,
          email: newUser[0].email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Registration error", error);
    await recordAttempt(ip, false);

    return NextResponse.json(
      { error: "Fehler bei der Registrierung" },
      { status: 500 }
    );
  }
}
