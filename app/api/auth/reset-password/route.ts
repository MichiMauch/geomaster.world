import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token und Passwort sind erforderlich" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Passwort muss mindestens 6 Zeichen lang sein" },
        { status: 400 }
      );
    }

    // Find the token
    const tokenRecord = await db.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.token, token),
      ),
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: "Ungültiger oder abgelaufener Link" },
        { status: 400 }
      );
    }

    // Check if it's a password reset token
    if (!tokenRecord.identifier.startsWith("password-reset:")) {
      return NextResponse.json(
        { error: "Ungültiger Token-Typ" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (tokenRecord.expires < new Date()) {
      // Delete expired token
      await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.token, token));

      return NextResponse.json(
        { error: "Der Link ist abgelaufen. Bitte fordere einen neuen an." },
        { status: 400 }
      );
    }

    // Extract email from identifier
    const email = tokenRecord.identifier.replace("password-reset:", "");

    // Find the user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return NextResponse.json(
        { error: "Benutzer nicht gefunden" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hash(password, 12);

    // Update user's password
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, user.id));

    // Delete the used token
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.token, token));

    return NextResponse.json({
      success: true,
      message: "Passwort wurde erfolgreich zurückgesetzt",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Fehler beim Zurücksetzen des Passworts" },
      { status: 500 }
    );
  }
}
