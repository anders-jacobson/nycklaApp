import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { DashboardSidebar } from '@/components/shared/dashboard-sidebar';
import { SiteHeader } from '@/components/shared/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

async function Layout({ children }: { children: React.ReactNode }) {
  // Create a Supabase client configured to use cookies
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // If there's an authenticated user, try to get their profile data
  let cooperative: string | undefined;
  let user: { name: string; email: string } | undefined;

  if (authUser) {
    try {
      // Use Prisma to find user by email (matching dashboard actions pattern)
      const profile = await prisma.user.findUnique({
        where: { email: authUser.email! },
        select: {
          cooperative: true,
          name: true,
          email: true,
        },
      });

      if (profile) {
        cooperative = profile.cooperative;
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
      <DashboardSidebar cooperative={cooperative} user={user} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
export default Layout;
