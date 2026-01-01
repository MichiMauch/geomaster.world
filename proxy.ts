import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Create next-intl middleware
const intlMiddleware = createIntlMiddleware(routing);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply next-intl middleware first for i18n routing
  const intlResponse = intlMiddleware(request);

  // Check for session cookie (NextAuth v4 with database strategy)
  const sessionToken = request.cookies.get('next-auth.session-token') ||
                       request.cookies.get('__Secure-next-auth.session-token');

  // Protected routes that require authentication
  const protectedPrefixes = ['/ranked/play', '/ranked/results', '/admin'];
  const isProtectedRoute = protectedPrefixes.some(prefix =>
    pathname.includes(prefix)
  );

  // If no session cookie on protected route, redirect to login
  if (isProtectedRoute && !sessionToken) {
    const locale = pathname.split('/')[1] || 'de';
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return intlResponse;
}

export const config = {
  // Match all pathnames except for API routes, static files, etc.
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes - including NextAuth)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt (public files)
     * - Files with extensions (images, etc)
     */
    '/((?!api/|_next/static|_next/image|favicon.ico|robots.txt|.*\\..*).*)',
  ]
};
