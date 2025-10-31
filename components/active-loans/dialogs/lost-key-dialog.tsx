'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { IconLoader, IconAlertTriangle } from '@tabler/icons-react';
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
        // Get key information for the selected key
        const selectedKey = borrowedKeys.find((k) => k.issueId === selectedId);
        const message = selectedKey
          ? `Key ${selectedKey.keyLabel}${selectedKey.copyNumber} marked as lost`
          : 'Key marked as lost';
        // Close dialog first, then show toast
        onOpenChange(false);
        // Use setTimeout to ensure dialog closes before toast
        setTimeout(() => {
          toastSuccess(message);
        }, 0);
      } else {
        toastError('Failed to mark key as lost', result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Ensure dialog closes if borrower is deleted or keys become empty
  React.useEffect(() => {
    if (open && borrowedKeys.length === 0) {
      onOpenChange(false);
    }
  }, [open, borrowedKeys.length, onOpenChange]);

  // Cleanup: Ensure body pointer-events is restored when dialog closes
  React.useEffect(() => {
    if (!open) {
      // Force cleanup of body styles when dialog closes
      // Use requestAnimationFrame + setTimeout to ensure this runs after Radix cleanup and animations
      const cleanup = () => {
        document.body.style.pointerEvents = '';
        document.body.style.overflow = '';
      };
      // Run after animation completes (200ms duration + buffer)
      const timer = setTimeout(cleanup, 250);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Also cleanup on unmount
  React.useEffect(() => {
    return () => {
      document.body.style.pointerEvents = '';
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Key as Lost</DialogTitle>
        </DialogHeader>
        <RadioGroup value={selectedId} onValueChange={setSelectedId}>
          {borrowedKeys.map((k) => (
            <div key={k.issueId} className="flex items-center space-x-2">
              <RadioGroupItem value={k.issueId} id={k.issueId} />
              <Label htmlFor={k.issueId} className="cursor-pointer font-normal">
                {k.keyLabel}
                {k.copyNumber} • {k.keyFunction}
              </Label>
            </div>
          ))}
        </RadioGroup>
        {isLastKeyForBorrower && (
          <div className="mt-3 p-3 rounded-md border border-destructive/50 bg-destructive/10 text-destructive">
            <div className="flex gap-2">
              <IconAlertTriangle className="h-5 w-5 flex-shrink-0" />
              <div className="text-sm">
                <strong>Warning:</strong> Marking this key as lost will permanently remove{' '}
                <strong>{borrowerName}</strong> from the system.
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !selectedId}
          >
            {isLoading && <IconLoader className="h-3.5 w-3.5 animate-spin mr-1" />}
            Mark as Lost
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

