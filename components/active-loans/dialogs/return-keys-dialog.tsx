'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IconLoader } from '@tabler/icons-react';
import { returnMultipleKeysAction } from '@/app/actions/issueKeyWrapper';
import { toastError, toastSuccess } from '@/components/ui/toast-store';
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
        toastSuccess(selectedIds.length === 1 ? 'Key returned' : 'Keys returned');
        onOpenChange(false);
      } else {
        toastError('Failed to return keys', result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select keys to return</DialogTitle>
          <DialogDescription>Choose which keys to return for {borrowerName}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {borrowedKeys.map((k) => (
            <label key={k.issueId} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.includes(k.issueId)}
                onChange={() => toggle(k.issueId)}
                className="cursor-pointer"
              />
              <span className="text-sm">
                {k.keyLabel}
                {k.copyNumber} • {k.keyFunction}
              </span>
            </label>
          ))}
        </div>
        {isLastSelectionForBorrower && (
          <div className="mt-3 p-3 rounded border border-amber-200 bg-amber-50 text-amber-900 text-sm">
            Returning all keys for <strong>{borrowerName}</strong> will remove their contact from
            the system.
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || selectedIds.length === 0}>
            {isLoading && <IconLoader className="h-3.5 w-3.5 animate-spin mr-1" />}
            Return {selectedIds.length === 1 ? 'Key' : 'Keys'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

