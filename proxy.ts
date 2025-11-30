import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Specific public paths - all other routes require authentication
const PUBLIC_PATHS = [
  '/auth',
  '/api/check-user-exists',
  '/',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const { response } = await updateSession(request);
    return response;
  }

  // For protected routes, check auth and redirect if needed
  const { response: supabaseResponse, user } = await updateSession(request);

  // Check if user is authenticated
  if (!user) {
    const loginUrl = new URL('/auth/login', request.url);
    const redirectResponse = NextResponse.redirect(loginUrl);
    // Copy over any cookies that were set during session update
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
