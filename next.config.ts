import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import withPWAInit from "@ducanh2912/next-pwa";

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  // Note: Cache-Control headers are set in API routes to prevent aggressive caching
  // Cache busting is handled by inline script in layout.tsx
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

export default withPWA(withNextIntl(nextConfig));
