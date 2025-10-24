'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IconLoader } from '@tabler/icons-react';
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select key to replace</DialogTitle>
          <DialogDescription>
            This marks the original key as lost, creates a new copy and issues it to {borrowerName}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select key to replace:</label>
            {borrowedKeys.map((k) => (
              <label key={k.issueId} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="replaceKey"
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
          <div className="space-y-2">
            <label htmlFor="dueDate" className="text-sm font-medium">
              Due date (optional)
            </label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={idChecked}
              onCheckedChange={(v) => setIdChecked(!!v)}
              aria-label="ID checked"
            />
            <span className="text-sm">I have verified the borrower&apos;s ID</span>
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

