'use client';

import * as React from 'react';
import { IconDashboard, IconHelp, IconListDetails, IconSettings } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';

import { NavMain } from './nav-main';
import { NavSecondary } from './nav-secondary';
import { NavUser } from './nav-user';
import { TeamSwitcher } from './team-switcher';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';

interface DashboardSidebarProps extends React.ComponentProps<typeof Sidebar> {
  organisations: Array<{ id: string; name: string; role: string }>;
  activeEntityId?: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export function DashboardSidebar({
  organisations,
  activeEntityId,
  user,
  ...props
}: DashboardSidebarProps) {
  const t = useTranslations('nav');
  const navMain = React.useMemo(
    () => [
      { title: t('activeLoans'), url: '/active-loans', icon: IconDashboard },
      { title: t('keys'), url: '/keys', icon: IconListDetails },
      { title: t('settings'), url: '/settings/organization', icon: IconSettings },
      { title: t('support'), url: '#', icon: IconHelp },
    ],
    [t],
  );
  const userData = {
    name: user?.name || user?.email || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        {activeEntityId && (
          <TeamSwitcher organisations={organisations} activeEntityId={activeEntityId} />
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />

        <NavSecondary items={[]} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
