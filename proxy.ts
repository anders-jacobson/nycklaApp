import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/session';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

// Public paths that don't require authentication (locale-stripped)
const PUBLIC_PATHS = ['/auth', '/api/', '/'];

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value, cookie);
  });
}

function getPreferredLocale(request: NextRequest): string {
  // 1. Cookie (persisted user preference)
  const cookie = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookie && routing.locales.includes(cookie as 'sv' | 'en')) return cookie;
  // 2. Already in URL
  const urlMatch = request.nextUrl.pathname.match(/^\/(sv|en)/);
  if (urlMatch) return urlMatch[1];
  // 3. Default
  return routing.defaultLocale;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Strip locale prefix for auth logic
  const pathnameWithoutLocale = pathname.replace(/^\/(sv|en)/, '') || '/';

  // Update Supabase session first
  const { response: sessionResponse, user } = await updateSession(request);

  // Check if public route
  const isPublicRoute = PUBLIC_PATHS.some(
    (p) =>
      pathnameWithoutLocale === p ||
      pathnameWithoutLocale.startsWith(p + '/') ||
      (p.endsWith('/') && pathnameWithoutLocale.startsWith(p)),
  );

  const locale = getPreferredLocale(request);

  // NOT logged in + protected route → redirect to login
  if (!user && !isPublicRoute) {
    const loginUrl = new URL(`/${locale}/auth/login`, request.url);
    const redirectResponse = NextResponse.redirect(loginUrl);
    copyCookies(sessionResponse, redirectResponse);
    return redirectResponse;
  }

  // LOGGED IN + auth pages → redirect to dashboard
  if (
    user &&
    pathnameWithoutLocale.startsWith('/auth') &&
    pathnameWithoutLocale !== '/auth/callback'
  ) {
    const dashboardUrl = new URL(`/${locale}/active-loans`, request.url);
    const redirectResponse = NextResponse.redirect(dashboardUrl);
    copyCookies(sessionResponse, redirectResponse);
    return redirectResponse;
  }

  // Run intl middleware for locale detection/routing
  const intlResponse = intlMiddleware(request);
  copyCookies(sessionResponse, intlResponse);
  return intlResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
