'use client';

import * as React from 'react';
import { IconBuilding, IconCheck, IconChevronDown, IconPlus } from '@tabler/icons-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { switchOrganisation } from '@/app/actions/organisation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Organisation {
  id: string;
  name: string;
  role: string;
}

interface TeamSwitcherProps {
  organisations: Organisation[];
  activeOrganisationId: string;
}

export function TeamSwitcher({ organisations, activeOrganisationId }: TeamSwitcherProps) {
  const router = useRouter();
  const [isSwitching, setIsSwitching] = React.useState(false);

  const activeOrg = organisations.find((org) => org.id === activeOrganisationId);

  if (!activeOrg) {
    return null;
  }

  const handleSwitchOrganisation = async (organisationId: string) => {
    if (organisationId === activeOrganisationId || isSwitching) return;

    setIsSwitching(true);
    try {
      const result = await switchOrganisation(organisationId);
      if (result.success) {
        router.refresh();
      } else {
        console.error('Failed to switch organisation:', result.error);
      }
    } catch (error) {
      console.error('Error switching organisation:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              disabled={isSwitching}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-sm font-semibold">
                  {activeOrg.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{activeOrg.name}</span>
                <span className="truncate text-xs text-muted-foreground capitalize">
                  {activeOrg.role.toLowerCase()}
                </span>
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
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Organisations
            </DropdownMenuLabel>
            {organisations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                className="gap-2 p-2 cursor-pointer"
                onClick={() => handleSwitchOrganisation(org.id)}
                disabled={isSwitching}
              >
                <div className="flex size-6 items-center justify-center rounded-sm border bg-background">
                  <span className="text-xs font-semibold">{org.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex flex-1 flex-col text-sm">
                  <span className="font-medium">{org.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {org.role.toLowerCase()}
                  </span>
                </div>
                {org.id === activeOrganisationId && <IconCheck className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2" asChild>
              <Link href="/organisations">
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <IconBuilding className="h-4 w-4" />
                </div>
                <div className="font-medium">Manage Organisations</div>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
