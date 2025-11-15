'use client';

import * as React from 'react';
import {
  IconBuilding,
  IconCamera,
  IconDashboard,
  IconFileAi,
  IconFileDescription,
  IconHelp,
  IconListDetails,
  IconSearch,
  IconSettings,
  IconUsers,
} from '@tabler/icons-react';

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

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    {
      title: 'Active Loans',
      url: '/active-loans',
      icon: IconDashboard,
    },
    {
      title: 'Keys',
      url: '/keys',
      icon: IconListDetails,
    },
    {
      title: 'Settings',
      url: '/settings/organization',
      icon: IconSettings,
    },
    {
      title: 'Support',
      url: '#',
      icon: IconHelp,
    },
  ],
  navClouds: [
    {
      title: 'Capture',
      icon: IconCamera,
      isActive: true,
      url: '#',
      items: [
        {
          title: 'Active Proposals',
          url: '#',
        },
        {
          title: 'Archived',
          url: '#',
        },
      ],
    },
    {
      title: 'Proposal',
      icon: IconFileDescription,
      url: '#',
      items: [
        {
          title: 'Active Proposals',
          url: '#',
        },
        {
          title: 'Archived',
          url: '#',
        },
      ],
    },
    {
      title: 'Prompts',
      icon: IconFileAi,
      url: '#',
      items: [
        {
          title: 'Active Proposals',
          url: '#',
        },
        {
          title: 'Archived',
          url: '#',
        },
      ],
    },
  ],
  navSecondary: [],
};

export function DashboardSidebar({
  organisations,
  activeEntityId,
  user,
  ...props
}: DashboardSidebarProps) {
  const userData = {
    name: user?.name || 'Loading...',
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
        <NavMain items={data.navMain} />

        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
