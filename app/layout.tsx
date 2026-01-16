import type { Metadata, Viewport } from "next";
import { Montserrat, Open_Sans } from "next/font/google";
import Script from "next/script";
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
      <head>
        <Script
          id="cache-buster"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var CACHE_KEY = "geomaster-app-version";
                var VERSION_URL = "/api/version?t=" + Date.now();

                // Check server version and compare with stored version
                fetch(VERSION_URL, { cache: "no-store" })
                  .then(function(r) { return r.json(); })
                  .then(function(data) {
                    var serverVersion = data.version;
                    var storedVersion = localStorage.getItem(CACHE_KEY);

                    console.log("[CacheBuster] Server version:", serverVersion, "Stored:", storedVersion);

                    if (storedVersion !== serverVersion) {
                      console.log("[CacheBuster] Version mismatch, clearing caches...");

                      // Clear all caches
                      if (window.caches) {
                        caches.keys().then(function(names) {
                          Promise.all(names.map(function(name) {
                            console.log("[CacheBuster] Deleting cache:", name);
                            return caches.delete(name);
                          }));
                        });
                      }

                      // Unregister all service workers
                      if (navigator.serviceWorker) {
                        navigator.serviceWorker.getRegistrations().then(function(regs) {
                          regs.forEach(function(reg) {
                            console.log("[CacheBuster] Unregistering service worker");
                            reg.unregister();
                          });
                        });
                      }

                      // Store new version
                      localStorage.setItem(CACHE_KEY, serverVersion);

                      // Reload if we had an old version (not first visit)
                      if (storedVersion !== null) {
                        console.log("[CacheBuster] Reloading page...");
                        setTimeout(function() {
                          window.location.reload();
                        }, 500);
                      }
                    }
                  })
                  .catch(function(e) { console.error("[CacheBuster] Error:", e); });
              })();
            `,
          }}
        />
      </head>
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
