import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// Placeholder: In a real implementation, you would verify the Supabase session/cookie here
// and check if the user profile is complete (has cooperative name)
// If not, redirect to /auth/complete-profile
// If yes, redirect to /dashboard

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/active-loans';

  if (code) {
    const supabase = await createClient();

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(new URL('/auth/login?error=auth_error', req.url));
    }

    // Get the current session after exchange
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // No user, redirect to login
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    const email = user.email;

    if (!email) {
      return NextResponse.redirect(new URL('/auth/login?error=no_email', req.url));
    }

    // Query User table for user
    const userRecord = await prisma.user.findUnique({
      where: { email },
      select: { activeOrganisationId: true },
    });

    if (!userRecord || !userRecord.activeOrganisationId) {
      // No user or missing entity, redirect to complete profile
      return NextResponse.redirect(new URL('/auth/complete-profile', req.url));
    }

    // User is complete, redirect to specified redirect URL or dashboard
    return NextResponse.redirect(new URL(next, req.url));
  }

  // No code provided, redirect to login
  return NextResponse.redirect(new URL('/auth/login?error=no_code', req.url));
}
