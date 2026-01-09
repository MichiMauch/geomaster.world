import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { activityLogger } from "@/lib/activity-logger";
import { users, verificationTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, locale = "de" } = body;

    if (!email) {
      return NextResponse.json(
        { error: "E-Mail ist erforderlich" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    // Always return success for security (don't reveal if user exists)
    if (!user || !user.password) {
      // User doesn't exist or has no password (OAuth only user)
      return NextResponse.json({
        success: true,
        message: "Falls ein Konto existiert, wurde eine E-Mail gesendet",
      });
    }

    // Delete any existing password reset tokens for this user
    const identifier = `password-reset:${email}`;
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, identifier));

    // Generate new token
    const token = nanoid(32);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save token
    await db.insert(verificationTokens).values({
      identifier,
      token,
      expires,
    });

    // Send password reset email
    await sendPasswordResetEmail(email, token, locale);

    // Log password reset requested (non-blocking)
    activityLogger.logAuth("password_reset_requested", user.id, { email }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Falls ein Konto existiert, wurde eine E-Mail gesendet",
    });
  } catch (error) {
    logger.error("Forgot password error", error);
    return NextResponse.json(
      { error: "Fehler beim Senden der E-Mail" },
      { status: 500 }
    );
  }
}
