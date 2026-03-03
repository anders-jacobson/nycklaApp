import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { acceptInvitation } from '@/app/actions/team';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  // Validate `next` is a relative path to prevent open redirect attacks
  const rawNext = searchParams.get('next') ?? '/active-loans';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/active-loans';
  const type = searchParams.get('type'); // email confirmation, password reset, etc.

  if (code) {
    const supabase = await createClient();

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(
        new URL('/auth/login?error=Unable to verify link. Please try again.', req.url),
      );
    }

    // Get the current session after exchange
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // No user, redirect to login
      return NextResponse.redirect(new URL('/auth/login?error=Session expired', req.url));
    }

    const email = user.email;
    const supabaseUserId = user.id;

    if (!email) {
      return NextResponse.redirect(new URL('/auth/login?error=no_email', req.url));
    }

    // Extract invitation token (from user_metadata or query params)
    const inviteToken =
      searchParams.get('inviteToken') || user.user_metadata?.inviteToken;

    // Note: Password reset flow removed - using passwordless auth only

    // ALWAYS upsert user (new or returning)
    // This creates a minimal record without granting org access
    const userRecord = await prisma.user.upsert({
      where: { id: supabaseUserId },
      create: {
        id: supabaseUserId,
        email: email,
        name: user.user_metadata?.full_name || null,
        activeOrganisationId: null, // No org assigned yet
      },
      update: {
        email: email, // Sync email changes for returning users
        // name is NOT synced - user controls it in app
      },
      select: {
        activeOrganisationId: true,
        organisations: {
          select: {
            organisationId: true,
            organisation: {
              select: { id: true, name: true },
            },
          },
          orderBy: { joinedAt: 'asc' }, // CRITICAL: Deterministic ordering
        },
      },
    });

    // If invitation token present, auto-accept invitation
    if (inviteToken) {
      const inviteResult = await acceptInvitation(inviteToken);
      if (!inviteResult.success) {
        // Invitation acceptance failed (expired, invalid, wrong email, etc.)
        return NextResponse.redirect(
          new URL(`/auth/complete-profile?error=${encodeURIComponent(inviteResult.error)}`, req.url),
        );
      }
      // Invitation accepted successfully - redirect to welcome screen
      return NextResponse.redirect(new URL('/welcome?from=invitation', req.url));
    }

    // Check membership count (this is authorization, not authentication)
    const membershipCount = userRecord.organisations.length;

    if (membershipCount === 0) {
      // No memberships = needs to create org or use invitation
      return NextResponse.redirect(new URL('/auth/complete-profile', req.url));
    }

    // Has memberships - ensure activeOrganisationId is valid
    if (
      !userRecord.activeOrganisationId ||
      !userRecord.organisations.some((o) => o.organisationId === userRecord.activeOrganisationId)
    ) {
      // activeOrganisationId is null or stale, set to first org
      const firstOrg = userRecord.organisations[0];
      await prisma.user.update({
        where: { id: supabaseUserId },
        data: { activeOrganisationId: firstOrg.organisationId },
      });
    }

    // User has valid membership and active org
    // Redirect to dashboard (magic link, OAuth, etc.)
    return NextResponse.redirect(new URL(next, req.url));
  }

  // No code provided, redirect to login
  return NextResponse.redirect(new URL('/auth/login?error=Invalid link', req.url));
}
