import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/session';

// Public paths that don't require authentication
const PUBLIC_PATHS = ['/auth', '/api/', '/'];

// Helper to copy cookies from one response to another
function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value, cookie);
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Update session and get user
  const { response, user } = await updateSession(request);

  // Check if this is a public path
  const isPublicRoute = PUBLIC_PATHS.some(
    (p) =>
      pathname === p || pathname.startsWith(p + '/') || (p.endsWith('/') && pathname.startsWith(p)),
  );

  // NOT logged in + trying to access protected route → redirect to login
  if (!user && !isPublicRoute) {
    const loginUrl = new URL('/auth/login', request.url);
    const redirectResponse = NextResponse.redirect(loginUrl);
    copyCookies(response, redirectResponse);
    return redirectResponse;
  }

  // LOGGED IN + trying to access auth pages (login/register/etc) → redirect to dashboard
  // (No need to show login page if already authenticated)
  if (user && pathname.startsWith('/auth') && pathname !== '/auth/callback') {
    const dashboardUrl = new URL('/active-loans', request.url);
    const redirectResponse = NextResponse.redirect(dashboardUrl);
    copyCookies(response, redirectResponse);
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, svgs, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
