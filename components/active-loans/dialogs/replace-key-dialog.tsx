'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IconLoader, IconAlertCircle } from '@tabler/icons-react';
import { markKeyLostAction } from '@/app/actions/issueKeyWrapper';
import { toastError, toastSuccess } from '@/components/ui/toast-store';
import type { BorrowedKeyInfo } from '../borrower-columns';

interface ReplaceKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  borrowerName: string;
  borrowedKeys: BorrowedKeyInfo[];
}

export function ReplaceKeyDialog({
  open,
  onOpenChange,
  borrowerName,
  borrowedKeys,
}: ReplaceKeyDialogProps) {
  const [selectedId, setSelectedId] = useState<string>(borrowedKeys[0]?.issueId ?? '');
  const [dueDate, setDueDate] = useState('');
  const [idChecked, setIdChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedId || !idChecked) return;
    setIsLoading(true);
    try {
      const result = await markKeyLostAction({
        issueRecordId: selectedId,
        createReplacement: true,
        issueReplacement: true,
        idChecked,
        dueDate: dueDate || undefined,
      });
      if (result.success) {
        toastSuccess('Key replaced and issued');
        onOpenChange(false);
      } else {
        toastError('Failed to replace key', result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

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
          <DialogTitle>Replace Lost Key</DialogTitle>
          <DialogDescription className="flex items-start gap-2">
            <IconAlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              This marks the original key as lost, creates a new copy and issues it to{' '}
              {borrowerName}.
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select key to replace:</Label>
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate" className="text-sm font-medium">
              Due date (optional)
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="idChecked"
              checked={idChecked}
              onCheckedChange={(v) => setIdChecked(!!v)}
            />
            <Label htmlFor="idChecked" className="cursor-pointer font-normal">
              I have verified the borrower&apos;s ID
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || !selectedId || !idChecked}>
            {isLoading && <IconLoader className="h-3.5 w-3.5 animate-spin mr-1" />}
            Replace Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

