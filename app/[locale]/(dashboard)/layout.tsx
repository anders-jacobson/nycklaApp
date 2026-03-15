import React from 'react';
import { redirect } from 'next/navigation'; // kept as next/navigation - locale injected via middleware
import { setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { DashboardSidebar } from '@/components/shared/dashboard-sidebar';
import { SiteHeader } from '@/components/shared/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { shouldShowOnboarding } from '@/lib/onboarding-utils';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { isConnectionError } from '@/lib/db-error-handler';

async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as 'sv' | 'en');
  // Create a Supabase client configured to use cookies
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // If there's an authenticated user, try to get their profile data
  let organisations: Array<{ id: string; name: string; role: string }> = [];
  let activeEntityId: string | undefined;
  let user: { name: string; email: string } | undefined;

  if (authUser) {
    try {
      // Use Prisma to find user by ID (aligned with Supabase auth.users.id)
      const profile = await prisma.user.findUnique({
        where: { id: authUser.id },
        select: {
          name: true,
          email: true,
          activeOrganisationId: true,
          organisations: {
            include: {
              organisation: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: { joinedAt: 'asc' }, // CRITICAL: Deterministic ordering for multi-org consistency
          },
        },
      });

      if (profile) {
        organisations = profile.organisations.map((o) => ({
          id: o.organisation.id,
          name: o.organisation.name,
          role: o.role,
        }));
        user = {
          name: profile.name || '',
          email: profile.email,
        };

        // Users with no org memberships must set one up before accessing dashboard
        if (organisations.length === 0) {
          redirect('/no-organization');
        }

        // Mirror getCurrentUser() fallback: if activeOrganisationId is null or no longer
        // a valid membership, fall back to the first org (deterministic due to orderBy asc).
        const isActiveOrgValid =
          profile.activeOrganisationId &&
          profile.organisations.some((o) => o.organisationId === profile.activeOrganisationId);
        activeEntityId = isActiveOrgValid
          ? profile.activeOrganisationId!
          : profile.organisations[0].organisationId;

        // Check if onboarding is needed
        const needsOnboarding = await shouldShowOnboarding(activeEntityId);
        if (needsOnboarding) {
          redirect('/onboarding/keys');
        }
      }
    } catch (error) {
      // Re-throw redirect errors - they must propagate for Next.js routing to work
      if (isRedirectError(error)) {
        throw error;
      }

      // Log connection errors differently
      if (isConnectionError(error)) {
        console.warn('Database connection issue (likely unstable network):', error);
      } else {
        console.error('Failed to fetch user profile:', error);
      }
    }
  }

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <DashboardSidebar organisations={organisations} activeEntityId={activeEntityId} user={user} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}
export default Layout;
