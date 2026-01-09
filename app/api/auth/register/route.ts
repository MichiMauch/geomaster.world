import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { activityLogger } from "@/lib/activity-logger";
import { users, verificationTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, nickname, email, password, locale = "de" } = body;

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, E-Mail und Passwort sind erforderlich" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Passwort muss mindestens 6 Zeichen lang sein" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Diese E-Mail-Adresse ist bereits registriert" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user (emailVerified stays NULL)
    const newUser = await db
      .insert(users)
      .values({
        name,
        nickname: nickname || null,
        email,
        password: hashedPassword,
      })
      .returning();

    // Generate verification token
    const token = nanoid(32);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save token
    await db.insert(verificationTokens).values({
      identifier: email,
      token,
      expires,
    });

    // Send verification email
    await sendVerificationEmail(email, token, locale);

    // Log registration
    await activityLogger.logAuth("register", newUser[0].id, { email });

    return NextResponse.json(
      {
        success: true,
        requiresVerification: true,
        user: {
          id: newUser[0].id,
          name: newUser[0].name,
          email: newUser[0].email
        }
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Registration error", error);
    return NextResponse.json(
      { error: "Fehler bei der Registrierung" },
      { status: 500 }
    );
  }
}
