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
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('settings');
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
        toastSuccess(t('deleteSuccessDeleted'));
        router.push('/no-organization');
      } else {
        const switchedToName = result.data?.switchedToOrgName;
        toastSuccess(
          switchedToName
            ? t('deleteSuccessSwitched', { name: switchedToName })
            : t('deleteSuccessDeleted'),
        );
        // Navigate to active-loans to start fresh with switched org
        router.push('/active-loans');
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
      title={t('deleteDialogTitle')}
      footer={
        <div className="flex w-full gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="flex-1"
          >
            {t('deleteCancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isValid || isDeleting}
            className="flex-1"
          >
            {isDeleting ? t('deleteDeleting') : t('deleteButton')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <IconAlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
          <div className="space-y-1 text-sm">
            <div className="font-medium text-destructive">{t('deleteIrreversible')}</div>
            <div className="text-muted-foreground">
              {t('deleteWarning', { name: organizationName })}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium">{t('deleteWillDelete')}</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md border p-3">
              <div className="text-2xl font-bold">{stats.memberCount}</div>
              <div className="text-muted-foreground">
                {t('deleteStatMembers', { count: stats.memberCount })}
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-2xl font-bold">{stats.keyTypeCount}</div>
              <div className="text-muted-foreground">{t('deleteStatKeyTypes')}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-2xl font-bold">{stats.keyCount}</div>
              <div className="text-muted-foreground">{t('deleteStatKeys')}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-2xl font-bold">{stats.borrowerCount}</div>
              <div className="text-muted-foreground">{t('deleteStatBorrowers')}</div>
            </div>
          </div>
          {stats.activeLoanCount > 0 && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
              <div className="text-2xl font-bold text-destructive">{stats.activeLoanCount}</div>
              <div className="text-sm text-destructive">{t('deleteActiveLoansWarning')}</div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-delete" className="text-sm font-medium">
            {t('deleteTypeToConfirm', { name: organizationName })}
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
              {copied ? <IconCheck className="h-4 w-4" /> : <IconCopy className="h-4 w-4" />}
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
          <div className="text-xs text-muted-foreground">{t('deletePressEnter')}</div>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
