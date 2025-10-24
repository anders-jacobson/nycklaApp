'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IconLoader } from '@tabler/icons-react';
import { markKeyLostAction } from '@/app/actions/issueKeyWrapper';
import { toastError, toastSuccess } from '@/components/ui/toast-store';
import type { BorrowedKeyInfo } from '../borrower-columns';

interface LostKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  borrowerName: string;
  borrowedKeys: BorrowedKeyInfo[];
  isLastKeyForBorrower: boolean;
}

export function LostKeyDialog({
  open,
  onOpenChange,
  borrowerName,
  borrowedKeys,
  isLastKeyForBorrower,
}: LostKeyDialogProps) {
  const [selectedId, setSelectedId] = useState<string>(borrowedKeys[0]?.issueId ?? '');
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedId) return;
    setIsLoading(true);
    try {
      const result = await markKeyLostAction({ issueRecordId: selectedId });
      if (result.success) {
        toastSuccess('Key marked as lost');
        onOpenChange(false);
      } else {
        toastError('Failed to mark key as lost', result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select the lost key</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {borrowedKeys.map((k) => (
            <label key={k.issueId} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="lostKey"
                checked={selectedId === k.issueId}
                onChange={() => setSelectedId(k.issueId)}
                className="cursor-pointer"
              />
              <span className="text-sm">
                {k.keyLabel}
                {k.copyNumber} • {k.keyFunction}
              </span>
            </label>
          ))}
        </div>
        {isLastKeyForBorrower && (
          <div className="mt-3 p-3 rounded border border-amber-200 bg-amber-50 text-amber-900 text-sm">
            If this is the last key, <strong>{borrowerName}</strong> will be removed from the
            system.
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || !selectedId}>
            {isLoading && <IconLoader className="h-3.5 w-3.5 animate-spin mr-1" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

