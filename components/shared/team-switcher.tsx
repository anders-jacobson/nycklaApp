'use client';

import * as React from 'react';
import { IconCheck, IconChevronDown, IconPlus } from '@tabler/icons-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

interface TeamSwitcherProps {
  entityName?: string;
  userRole?: string;
}

export function TeamSwitcher({ entityName, userRole }: TeamSwitcherProps) {
  const [activeTeam, setActiveTeam] = React.useState({
    name: entityName || 'Loading...',
    role: userRole || '',
  });

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-sm font-semibold">
                  {activeTeam.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{activeTeam.name}</span>
                {activeTeam.role && (
                  <span className="truncate text-xs text-muted-foreground capitalize">
                    {activeTeam.role.toLowerCase()}
                  </span>
                )}
              </div>
              <IconChevronDown className="ml-auto h-4 w-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">Organizations</DropdownMenuLabel>
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-sm border bg-background">
                <span className="text-xs font-semibold">
                  {activeTeam.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-1 flex-col text-sm">
                <span className="font-medium">{activeTeam.name}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {activeTeam.role.toLowerCase()}
                </span>
              </div>
              <IconCheck className="ml-auto h-4 w-4" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2" disabled>
              <div className="flex size-6 items-center justify-center rounded-md border border-dashed bg-background">
                <IconPlus className="h-4 w-4" />
              </div>
              <div className="font-medium text-muted-foreground">Join Another Organization</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

