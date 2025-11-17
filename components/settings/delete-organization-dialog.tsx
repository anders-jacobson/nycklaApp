'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { deleteOrganisation } from '@/app/actions/organisation';
import { IconAlertTriangle, IconCopy, IconCheck } from '@tabler/icons-react';
import { toastError, toastSuccess } from '@/components/ui/toast-store';

interface DeleteOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationName: string;
  stats: {
    memberCount: number;
    keyTypeCount: number;
    keyCount: number;
    borrowerCount: number;
    activeLoanCount: number;
  };
}

export function DeleteOrganizationDialog({
  open,
  onOpenChange,
  organizationName,
  stats,
}: DeleteOrganizationDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const isValid = confirmText === organizationName;

  const handleCopyOrgName = () => {
    navigator.clipboard.writeText(organizationName);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!isValid) return;

    setIsDeleting(true);

    const result = await deleteOrganisation();

    setIsDeleting(false);

    if (result.success) {
      onOpenChange(false);

      // Redirect based on whether user has other orgs
      if (result.data?.needsOrganization) {
        toastSuccess('Organization deleted successfully');
        router.push('/no-organization');
      } else {
        const switchedToName = result.data?.switchedToOrgName;
        toastSuccess(
          switchedToName
            ? `Organization deleted. Switched to "${switchedToName}"`
            : 'Organization deleted successfully',
        );
        router.push('/');
        router.refresh();
      }
    } else {
      toastError(result.error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isValid && !isDeleting) {
      e.preventDefault();
      handleDelete();
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Organization"
      description={
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-md border border-destructive/50 bg-destructive/10 p-3">
            <IconAlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-destructive">This action is irreversible</p>
              <p className="text-muted-foreground">
                All data related to <span className="font-semibold">{organizationName}</span> will
                be permanently deleted.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">This will delete:</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border p-3">
                <div className="text-2xl font-bold">{stats.memberCount}</div>
                <div className="text-muted-foreground">
                  {stats.memberCount === 1 ? 'Member' : 'Members'}
                </div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-2xl font-bold">{stats.keyTypeCount}</div>
                <div className="text-muted-foreground">Key Types</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-2xl font-bold">{stats.keyCount}</div>
                <div className="text-muted-foreground">Keys</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-2xl font-bold">{stats.borrowerCount}</div>
                <div className="text-muted-foreground">Borrowers</div>
              </div>
            </div>
            {stats.activeLoanCount > 0 && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
                <div className="text-2xl font-bold text-destructive">{stats.activeLoanCount}</div>
                <div className="text-sm text-destructive">
                  Active {stats.activeLoanCount === 1 ? 'Loan' : 'Loans'} will be permanently lost
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-delete" className="text-sm font-medium">
              Type{' '}
              <span className="select-all font-mono font-semibold text-foreground">
                {organizationName}
              </span>{' '}
              to confirm
            </Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyOrgName}
                className="shrink-0"
                title="Copy organization name"
              >
                {copied ? (
                  <IconCheck className="h-4 w-4" />
                ) : (
                  <IconCopy className="h-4 w-4" />
                )}
              </Button>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={organizationName}
                className="flex-1"
                disabled={isDeleting}
                autoComplete="off"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Press Enter to confirm deletion once you&apos;ve typed the name
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex w-full gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isValid || isDeleting}
            className="flex-1"
          >
            {isDeleting ? 'Deleting...' : 'Delete Organization'}
          </Button>
        </div>
      }
    />
  );
}

