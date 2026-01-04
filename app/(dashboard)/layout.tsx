import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { DashboardSidebar } from '@/components/shared/dashboard-sidebar';
import { SiteHeader } from '@/components/shared/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';

async function Layout({ children }: { children: React.ReactNode }) {
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
          },
        },
      });

      if (profile) {
        activeEntityId = profile.activeOrganisationId || undefined;
        organisations = profile.organisations.map((o) => ({
          id: o.organisation.id,
          name: o.organisation.name,
          role: o.role,
        }));
        user = {
          name: profile.name || '',
          email: profile.email,
        };
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
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
      <DashboardSidebar
        organisations={organisations}
        activeEntityId={activeEntityId}
        user={user}
      />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}
export default Layout;
