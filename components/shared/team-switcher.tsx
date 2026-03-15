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
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { switchOrganisation, createOrganisation } from '@/app/actions/organisation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

interface Organisation {
  id: string;
  name: string;
  role: string;
}

interface TeamSwitcherProps {
  organisations: Organisation[];
  activeEntityId: string;
}

export function TeamSwitcher({ organisations, activeEntityId }: TeamSwitcherProps) {
  const t = useTranslations('org');
  const router = useRouter();
  const [isSwitching, setIsSwitching] = React.useState(false);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [newOrgName, setNewOrgName] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  const activeOrg = organisations.find((org) => org.id === activeEntityId);

  if (!activeOrg) {
    return null;
  }

  const handleSwitchOrganisation = async (organisationId: string) => {
    if (organisationId === activeEntityId || isSwitching) return;

    setIsSwitching(true);
    try {
      const result = await switchOrganisation(organisationId);
      if (result.success) {
        // Navigate to active-loans to force layout re-render with new org context
        router.push('/active-loans');
        // Refresh to invalidate caches and fetch fresh data
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

  const handleCreateOrganisation = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setIsCreating(true);

    try {
      const result = await createOrganisation(newOrgName);
      if (result.success) {
        setShowCreateDialog(false);
        setNewOrgName('');
        // Navigate to active-loans to start fresh with new org
        router.push('/active-loans');
        // Refresh to load new organization's data
        router.refresh();
      } else {
        setCreateError(result.error);
      }
    } catch (error) {
      setCreateError(t('unexpectedError'));
      console.error('Error creating organisation:', error);
    } finally {
      setIsCreating(false);
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
              {t('switcherLabel')}
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
                {org.id === activeEntityId && <IconCheck className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2 cursor-pointer"
              onClick={() => setShowCreateDialog(true)}
            >
              <div className="flex size-6 items-center justify-center rounded-sm border bg-background">
                <IconPlus className="h-4 w-4" />
              </div>
              <span className="font-medium">{t('createOrg')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <ResponsiveDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        title={t('createOrgTitle')}
        description={t('createOrgDescription')}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={isCreating}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              form="create-org-form"
              disabled={isCreating || !newOrgName.trim()}
            >
              {isCreating ? t('creating') : t('createOrg')}
            </Button>
          </>
        }
      >
        <form id="create-org-form" onSubmit={handleCreateOrganisation}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="organisation-name">{t('orgNameLabel')}</Label>
              <Input
                id="organisation-name"
                placeholder={t('orgNamePlaceholder')}
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                required
                minLength={2}
                maxLength={200}
                disabled={isCreating}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
              />
              <p className="text-sm text-muted-foreground">{t('orgNameHint')}</p>
            </div>

            {createError && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {createError}
              </div>
            )}
          </div>
        </form>
      </ResponsiveDialog>
    </SidebarMenu>
  );
}
