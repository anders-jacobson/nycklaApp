'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { IconLoader } from '@tabler/icons-react';
import { returnMultipleKeysAction } from '@/app/actions/issueKeyWrapper';
import { toastError, toastSuccess } from '@/components/ui/toast-store';
import { useTranslations } from 'next-intl';
import type { BorrowedKeyInfo } from '../borrower-columns';

interface ReturnKeysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  borrowerName: string;
  borrowedKeys: BorrowedKeyInfo[];
  totalKeysForBorrower: number;
}

export function ReturnKeysDialog({
  open,
  onOpenChange,
  borrowerName,
  borrowedKeys,
  totalKeysForBorrower,
}: ReturnKeysDialogProps) {
  const t = useTranslations('activeLoans');
  const [selectedIds, setSelectedIds] = useState<string[]>(borrowedKeys.map((k) => k.issueId));
  const [isLoading, setIsLoading] = useState(false);

  const isLastSelectionForBorrower = selectedIds.length === totalKeysForBorrower;

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleConfirm = async () => {
    if (selectedIds.length === 0) return;
    setIsLoading(true);
    try {
      const result = await returnMultipleKeysAction(selectedIds);
      if (result.success) {
        // Close dialog immediately
        onOpenChange(false);

        // Get key information for the returned keys
        const returnedKeys = borrowedKeys.filter((k) => selectedIds.includes(k.issueId));

        // Create descriptive toast message
        let message: string;
        if (returnedKeys.length === 1) {
          const key = returnedKeys[0];
          message = t('returnKeysSuccessSingle', { label: key.keyLabel, copy: key.copyNumber });
        } else {
          const keyList = returnedKeys.map((k) => `${k.keyLabel}${k.copyNumber}`).join(', ');
          message = t('returnKeysSuccessMultiple', { count: returnedKeys.length, keyList });
        }

        toastSuccess(message);
      } else {
        toastError(t('returnKeysError'), result.error);
      }
    } catch (error) {
      toastError(t('returnKeysError'), error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Ensure dialog closes if borrowedKeys becomes empty
  React.useEffect(() => {
    if (open && borrowedKeys.length === 0) {
      onOpenChange(false);
    }
  }, [open, borrowedKeys.length, onOpenChange]);

  return (
    <ResponsiveDialog
      open={open && borrowedKeys.length > 0}
      onOpenChange={onOpenChange}
      title={t('returnKeysTitle')}
      description={t('returnKeysDescription', { borrowerName })}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {t('returnKeysCancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || selectedIds.length === 0}>
            {isLoading && <IconLoader className="h-3.5 w-3.5 animate-spin mr-1" />}
            {t('returnKeysButton', { count: selectedIds.length })}
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        {borrowedKeys.map((k) => (
          <div key={k.issueId} className="flex items-center space-x-2">
            <Checkbox
              id={k.issueId}
              checked={selectedIds.includes(k.issueId)}
              onCheckedChange={() => toggle(k.issueId)}
            />
            <Label htmlFor={k.issueId} className="cursor-pointer font-normal">
              {k.keyLabel}
              {k.copyNumber} • {k.keyFunction}
            </Label>
          </div>
        ))}
      </div>
      {isLastSelectionForBorrower && (
        <div className="mt-3 p-3 rounded border border-amber-200 bg-amber-50 text-amber-900 text-sm">
          {t.rich('returnKeysWarning', {
            name: borrowerName,
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </div>
      )}
    </ResponsiveDialog>
  );
}
