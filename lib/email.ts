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
  const fromName = process.env.MANDRILL_FROM_NAME || "PinPoint - GeoGuesser";
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
      greeting: "Willkommen bei PinPoint!",
      message: "Bitte klicke auf den folgenden Link, um deine E-Mail-Adresse zu bestätigen:",
      button: "E-Mail bestätigen",
      expiry: "Dieser Link ist 24 Stunden gültig.",
      ignore: "Falls du dich nicht bei PinPoint registriert hast, kannst du diese E-Mail ignorieren.",
    },
    en: {
      subject: "Confirm your email address",
      greeting: "Welcome to PinPoint!",
      message: "Please click the following link to confirm your email address:",
      button: "Confirm Email",
      expiry: "This link is valid for 24 hours.",
      ignore: "If you did not register at PinPoint, you can ignore this email.",
    },
    sl: {
      subject: "Potrdi svoj e-poštni naslov",
      greeting: "Dobrodošli na PinPoint!",
      message: "Prosimo, kliknite na naslednjo povezavo, da potrdite svoj e-poštni naslov:",
      button: "Potrdi e-pošto",
      expiry: "Ta povezava velja 24 ur.",
      ignore: "Če se niste registrirali na PinPoint, lahko to e-pošto ignorirate.",
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
      subject: "Dein Login-Link für PinPoint",
      greeting: "Login-Link angefordert",
      message: "Klicke auf den folgenden Link, um dich bei PinPoint anzumelden:",
      button: "Jetzt anmelden",
      expiry: "Dieser Link ist 24 Stunden gültig und kann nur einmal verwendet werden.",
      ignore: "Falls du diesen Link nicht angefordert hast, kannst du diese E-Mail ignorieren.",
    },
    en: {
      subject: "Your login link for PinPoint",
      greeting: "Login link requested",
      message: "Click the following link to sign in to PinPoint:",
      button: "Sign in now",
      expiry: "This link is valid for 24 hours and can only be used once.",
      ignore: "If you did not request this link, you can ignore this email.",
    },
    sl: {
      subject: "Vaša povezava za prijavo v PinPoint",
      greeting: "Zahtevana povezava za prijavo",
      message: "Kliknite na naslednjo povezavo, da se prijavite v PinPoint:",
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
