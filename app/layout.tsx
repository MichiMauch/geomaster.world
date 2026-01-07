import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GeoMaster World",
  description: "Teste dein geografisches Wissen",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GeoMaster World",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0A0A0F",
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  const lang = locale || "de";

  return (
    <html lang={lang} className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-background text-text-primary`}>
        <Providers>{children}</Providers>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "var(--surface-2)",
              color: "var(--text-primary)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-lg)",
            },
            success: {
              iconTheme: {
                primary: "var(--success)",
                secondary: "white",
              },
            },
            error: {
              iconTheme: {
                primary: "var(--error)",
                secondary: "white",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
