import type { Metadata, Viewport } from "next";
import { Montserrat, Open_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "react-hot-toast";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GeoMaster World",
  description: "Teste dein geografisches Wissen",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png" },
      { url: "/apple-touch-icon-57x57.png", sizes: "57x57" },
      { url: "/apple-touch-icon-60x60.png", sizes: "60x60" },
      { url: "/apple-touch-icon-72x72.png", sizes: "72x72" },
      { url: "/apple-touch-icon-76x76.png", sizes: "76x76" },
      { url: "/apple-touch-icon-114x114.png", sizes: "114x114" },
      { url: "/apple-touch-icon-120x120.png", sizes: "120x120" },
      { url: "/apple-touch-icon-144x144.png", sizes: "144x144" },
      { url: "/apple-touch-icon-152x152.png", sizes: "152x152" },
      { url: "/apple-touch-icon-167x167.png", sizes: "167x167" },
      { url: "/apple-touch-icon-180x180.png", sizes: "180x180" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GeoMaster World",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "application-name": "GeoMaster World",
    "msapplication-TileColor": "#0a0a0f",
    "msapplication-TileImage": "/mstile-144x144.png",
    "msapplication-config": "/browserconfig.xml",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0f",
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
      <body className={`${montserrat.variable} ${openSans.variable} font-sans antialiased bg-background text-text-primary`}>
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
