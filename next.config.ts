import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import withPWAInit from "@ducanh2912/next-pwa";

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: true, // TEMPORARILY DISABLED to clear old service workers
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
  // Skip TypeScript check during build to avoid timeout on Coolify
  // TypeScript errors are caught during development
  typescript: {
    ignoreBuildErrors: true,
  },
  // Exclude @libsql/client from bundling - it has native bindings
  // that don't work when bundled by webpack/turbopack
  serverExternalPackages: ['@libsql/client'],
};

export default withPWA(withNextIntl(nextConfig));
