import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Protected route prefixes — any path matching one of these requires a valid
 * Supabase session.  Auth pages (/auth/*) and the root (/) remain public.
 */
const PROTECTED_PREFIXES = [
  '/active-loans',
  '/keys',
  '/settings',
  '/onboarding',
  '/create-organization',
  '/issue-key',
  '/welcome',
  '/no-organization',
];

export async function middleware(request: NextRequest) {
  // Build a mutable response so Supabase can refresh session cookies.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Propagate updated cookies to both request and response so the
          // refreshed session is visible to Server Components downstream.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() validates the token against the Supabase auth server — safer
  // than getSession() which only reads the local cookie without revalidation.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run middleware on all routes except Next.js internals and static assets.
     * Regex matches everything except paths starting with:
     *   _next/static, _next/image, favicon.ico, and common image extensions.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
