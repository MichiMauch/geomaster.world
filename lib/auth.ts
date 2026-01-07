import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { accounts, sessions, users, verificationTokens } from "./db/schema";
import { sendMagicLinkEmail } from "./email";

// Re-export für Rückwärtskompatibilität
export { isSuperAdmin } from "./super-admin";

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    EmailProvider({
      server: {
        host: process.env.MANDRILL_SERVER_HOST,
        port: parseInt(process.env.MANDRILL_SERVER_PORT || "587"),
        auth: {
          user: process.env.MANDRILL_FROM_EMAIL,
          pass: process.env.MANDRILL_API_KEY,
        },
      },
      from: `"${process.env.MANDRILL_FROM_NAME || "GeoMaster"}" <${process.env.MANDRILL_FROM_EMAIL}>`,
      sendVerificationRequest: async ({ identifier: email, url }) => {
        // Extract locale from the callback URL if present, default to "de"
        const locale = url.includes("/en/") ? "en" : url.includes("/sl/") ? "sl" : "de";
        await sendMagicLinkEmail(email, url, locale);
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email),
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        // Check if email is verified
        if (!user.emailVerified) {
          // Throw error with specific message that client can detect
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          isSuperAdmin: user.isSuperAdmin ?? false,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    signIn: async ({ account }) => {
      // Explicitly allow all sign-ins (OAuth and credentials)
      return true;
    },
    jwt: async ({ token, user, trigger }) => {
      if (user) {
        token.id = user.id;
        token.isSuperAdmin = (user as { isSuperAdmin?: boolean }).isSuperAdmin ?? false;
      }
      // For OAuth logins: load isSuperAdmin from DB on sign in
      if (trigger === "signIn" && token.id && !token.isSuperAdmin) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, token.id as string),
        });
        token.isSuperAdmin = dbUser?.isSuperAdmin ?? false;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.isSuperAdmin = token.isSuperAdmin ?? false;
      }
      return session;
    },
    redirect: async ({ url, baseUrl }) => {
      // If url is relative, make it absolute
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // If url is on the same origin, allow it
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Otherwise redirect to home
      return baseUrl;
    },
  },
  pages: {
    signIn: "/",
  },
  debug: process.env.NODE_ENV === "development",
} as const;
