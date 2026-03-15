'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DeleteOrganizationDialog } from './delete-organization-dialog';
import { getOrganisationDeletionStats } from '@/app/actions/organisation';
import { IconTrash } from '@tabler/icons-react';
import { toastError } from '@/components/ui/toast-store';

interface DeleteOrganizationSectionProps {
  organizationName: string;
  isOwner: boolean;
}

export function DeleteOrganizationSection({
  organizationName,
  isOwner,
}: DeleteOrganizationSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stats, setStats] = useState<{
    memberCount: number;
    keyTypeCount: number;
    keyCount: number;
    borrowerCount: number;
    activeLoanCount: number;
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const handleOpenDialog = async () => {
    setLoadingStats(true);

    const result = await getOrganisationDeletionStats();

    setLoadingStats(false);

    if (result.success && result.data) {
      setStats(result.data);
      setDialogOpen(true);
    } else {
      toastError(!result.success ? result.error : 'Failed to load organization statistics');
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <>
      <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-destructive">Delete Organization</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Permanently delete this organization and all of its data. This action cannot be
              undone.
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-md border border-muted-foreground/20 bg-background p-3 text-sm">
            <div className="space-y-1">
              <p className="font-medium">Before you can delete:</p>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>All other members must leave the organization first</li>
                <li>You must be the last remaining member</li>
                <li>All data including keys, borrowers, and loan history will be deleted</li>
              </ul>
            </div>
          </div>

          <Button
            variant="destructive"
            onClick={handleOpenDialog}
            disabled={loadingStats}
            className="w-full sm:w-auto"
          >
            <IconTrash className="h-4 w-4" />
            {loadingStats ? 'Loading...' : 'Delete Organization'}
          </Button>
        </div>
      </div>

      {stats && (
        <DeleteOrganizationDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          organizationName={organizationName}
          stats={stats}
        />
      )}
    </>
  );
}
