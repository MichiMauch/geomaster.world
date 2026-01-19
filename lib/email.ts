import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.MANDRILL_SERVER_HOST,
  port: parseInt(process.env.MANDRILL_SERVER_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.MANDRILL_FROM_EMAIL,
    pass: process.env.MANDRILL_API_KEY,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const fromName = process.env.MANDRILL_FROM_NAME || "GeoMaster";
  const fromEmail = process.env.MANDRILL_FROM_EMAIL;

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
  });
}

export async function sendVerificationEmail(email: string, token: string, locale: string = "de") {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/${locale}/verify-email?token=${token}`;

  const translations = {
    de: {
      subject: "Bestätige deine E-Mail-Adresse",
      greeting: "Willkommen bei GeoMaster!",
      message: "Bitte klicke auf den folgenden Link, um deine E-Mail-Adresse zu bestätigen:",
      button: "E-Mail bestätigen",
      expiry: "Dieser Link ist 24 Stunden gültig.",
      ignore: "Falls du dich nicht bei GeoMaster registriert hast, kannst du diese E-Mail ignorieren.",
    },
    en: {
      subject: "Confirm your email address",
      greeting: "Welcome to GeoMaster!",
      message: "Please click the following link to confirm your email address:",
      button: "Confirm Email",
      expiry: "This link is valid for 24 hours.",
      ignore: "If you did not register at GeoMaster, you can ignore this email.",
    },
    sl: {
      subject: "Potrdi svoj e-poštni naslov",
      greeting: "Dobrodošli na GeoMaster!",
      message: "Prosimo, kliknite na naslednjo povezavo, da potrdite svoj e-poštni naslov:",
      button: "Potrdi e-pošto",
      expiry: "Ta povezava velja 24 ur.",
      ignore: "Če se niste registrirali na GeoMaster, lahko to e-pošto ignorirate.",
    },
  };

  const t = translations[locale as keyof typeof translations] || translations.de;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0f; color: #e5e5e5; padding: 40px 20px; margin: 0;">
      <div style="max-width: 480px; margin: 0 auto; background-color: #1a1a24; border-radius: 12px; padding: 40px; border: 1px solid rgba(255,255,255,0.1);">
        <h1 style="color: #00d9ff; margin: 0 0 24px 0; font-size: 24px;">${t.greeting}</h1>
        <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 24px 0;">${t.message}</p>
        <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #00d9ff, #00b8d9); color: #000; font-weight: 600; padding: 14px 32px; border-radius: 8px; text-decoration: none; margin: 0 0 24px 0;">${t.button}</a>
        <p style="color: #666; font-size: 14px; margin: 24px 0 0 0;">${t.expiry}</p>
        <p style="color: #666; font-size: 12px; margin: 16px 0 0 0;">${t.ignore}</p>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: t.subject,
    html,
  });
}

export async function sendMagicLinkEmail(email: string, url: string, locale: string = "de") {
  const translations = {
    de: {
      subject: "Dein Login-Link für GeoMaster",
      greeting: "Login-Link angefordert",
      message: "Klicke auf den folgenden Link, um dich bei GeoMaster anzumelden:",
      button: "Jetzt anmelden",
      expiry: "Dieser Link ist 24 Stunden gültig und kann nur einmal verwendet werden.",
      ignore: "Falls du diesen Link nicht angefordert hast, kannst du diese E-Mail ignorieren.",
    },
    en: {
      subject: "Your login link for GeoMaster",
      greeting: "Login link requested",
      message: "Click the following link to sign in to GeoMaster:",
      button: "Sign in now",
      expiry: "This link is valid for 24 hours and can only be used once.",
      ignore: "If you did not request this link, you can ignore this email.",
    },
    sl: {
      subject: "Vaša povezava za prijavo v GeoMaster",
      greeting: "Zahtevana povezava za prijavo",
      message: "Kliknite na naslednjo povezavo, da se prijavite v GeoMaster:",
      button: "Prijava",
      expiry: "Ta povezava velja 24 ur in jo lahko uporabite samo enkrat.",
      ignore: "Če niste zahtevali te povezave, lahko to e-pošto ignorirate.",
    },
  };

  const t = translations[locale as keyof typeof translations] || translations.de;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0f; color: #e5e5e5; padding: 40px 20px; margin: 0;">
      <div style="max-width: 480px; margin: 0 auto; background-color: #1a1a24; border-radius: 12px; padding: 40px; border: 1px solid rgba(255,255,255,0.1);">
        <h1 style="color: #00d9ff; margin: 0 0 24px 0; font-size: 24px;">${t.greeting}</h1>
        <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 24px 0;">${t.message}</p>
        <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #00d9ff, #00b8d9); color: #000; font-weight: 600; padding: 14px 32px; border-radius: 8px; text-decoration: none; margin: 0 0 24px 0;">${t.button}</a>
        <p style="color: #666; font-size: 14px; margin: 24px 0 0 0;">${t.expiry}</p>
        <p style="color: #666; font-size: 12px; margin: 16px 0 0 0;">${t.ignore}</p>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: t.subject,
    html,
  });
}

export async function sendPasswordResetEmail(email: string, token: string, locale: string = "de") {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/${locale}/reset-password?token=${token}`;

  const translations = {
    de: {
      subject: "Passwort zurücksetzen",
      greeting: "Passwort zurücksetzen",
      message: "Du hast angefordert, dein Passwort zurückzusetzen. Klicke auf den folgenden Link:",
      button: "Passwort zurücksetzen",
      expiry: "Dieser Link ist 24 Stunden gültig.",
      ignore: "Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren. Dein Passwort bleibt unverändert.",
    },
    en: {
      subject: "Reset your password",
      greeting: "Reset your password",
      message: "You requested to reset your password. Click the following link:",
      button: "Reset password",
      expiry: "This link is valid for 24 hours.",
      ignore: "If you did not request this, you can ignore this email. Your password will remain unchanged.",
    },
    sl: {
      subject: "Ponastavitev gesla",
      greeting: "Ponastavitev gesla",
      message: "Zahtevali ste ponastavitev gesla. Kliknite na naslednjo povezavo:",
      button: "Ponastavi geslo",
      expiry: "Ta povezava velja 24 ur.",
      ignore: "Če niste zahtevali te spremembe, lahko to e-pošto ignorirate. Vaše geslo bo ostalo nespremenjeno.",
    },
  };

  const t = translations[locale as keyof typeof translations] || translations.de;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0f; color: #e5e5e5; padding: 40px 20px; margin: 0;">
      <div style="max-width: 480px; margin: 0 auto; background-color: #1a1a24; border-radius: 12px; padding: 40px; border: 1px solid rgba(255,255,255,0.1);">
        <h1 style="color: #00d9ff; margin: 0 0 24px 0; font-size: 24px;">${t.greeting}</h1>
        <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 24px 0;">${t.message}</p>
        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #00d9ff, #00b8d9); color: #000; font-weight: 600; padding: 14px 32px; border-radius: 8px; text-decoration: none; margin: 0 0 24px 0;">${t.button}</a>
        <p style="color: #666; font-size: 14px; margin: 24px 0 0 0;">${t.expiry}</p>
        <p style="color: #666; font-size: 12px; margin: 16px 0 0 0;">${t.ignore}</p>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: t.subject,
    html,
  });
}

/**
 * Send email notification when a duel is completed (to challenger)
 */
export async function sendDuelCompletedEmail(
  email: string,
  challengerName: string,
  accepterName: string,
  duelId: string,
  challengerWon: boolean,
  locale: string = "de"
) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resultsUrl = `${baseUrl}/${locale}/guesser/duel/results/${duelId}`;

  const translations = {
    de: {
      subject: challengerWon ? "Du hast das Duell gewonnen!" : "Dein Duell-Ergebnis ist da!",
      greeting: challengerWon ? "Gratulation!" : "Duell abgeschlossen",
      message: challengerWon
        ? `${accepterName} hat deine Herausforderung angenommen und du hast gewonnen!`
        : `${accepterName} hat deine Herausforderung angenommen und gewonnen.`,
      button: "Ergebnis ansehen",
      footer: "Bereit für eine Revanche?",
    },
    en: {
      subject: challengerWon ? "You won the duel!" : "Your duel result is ready!",
      greeting: challengerWon ? "Congratulations!" : "Duel Completed",
      message: challengerWon
        ? `${accepterName} accepted your challenge and you won!`
        : `${accepterName} accepted your challenge and won.`,
      button: "View Result",
      footer: "Ready for a rematch?",
    },
    sl: {
      subject: challengerWon ? "Zmagal si dvoboj!" : "Rezultat dvoboja je tukaj!",
      greeting: challengerWon ? "Čestitamo!" : "Dvoboj zaključen",
      message: challengerWon
        ? `${accepterName} je sprejel tvoj izziv in zmagal si!`
        : `${accepterName} je sprejel tvoj izziv in zmagal.`,
      button: "Poglej rezultat",
      footer: "Pripravljen na revanšo?",
    },
  };

  const t = translations[locale as keyof typeof translations] || translations.de;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0f; color: #e5e5e5; padding: 40px 20px; margin: 0;">
      <div style="max-width: 480px; margin: 0 auto; background-color: #1a1a24; border-radius: 12px; padding: 40px; border: 1px solid rgba(255,255,255,0.1);">
        <h1 style="color: ${challengerWon ? "#00FF88" : "#00d9ff"}; margin: 0 0 24px 0; font-size: 24px;">${t.greeting}</h1>
        <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 24px 0;">${t.message}</p>
        <a href="${resultsUrl}" style="display: inline-block; background: linear-gradient(135deg, #00d9ff, #00b8d9); color: #000; font-weight: 600; padding: 14px 32px; border-radius: 8px; text-decoration: none; margin: 0 0 24px 0;">${t.button}</a>
        <p style="color: #666; font-size: 14px; margin: 24px 0 0 0;">${t.footer}</p>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: t.subject,
    html,
  });
}
