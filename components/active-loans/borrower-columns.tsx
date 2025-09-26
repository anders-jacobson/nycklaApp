'use client';

import { useState, useRef } from 'react';
import { ColumnDef, HeaderContext, CellContext } from '@tanstack/react-table';

import {
  IconArrowsUpDown,
  IconDotsVertical,
  IconInfoCircle,
  IconLoader,
} from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { KeyboardShortcutTip } from '@/components/ui/keyboard-tip';
import { IconMail, IconPhone, IconKeyOff, IconEdit, IconPlus } from '@tabler/icons-react';
import { updateBorrowerPurpose } from '@/app/actions/dashboard';

// Affiliation Info Dialog Component
function AffiliationInfoDialog({ borrower }: { borrower: BorrowerWithKeys }) {
  const [purpose, setPurpose] = useState(borrower.purposeNotes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handlePurposeChange = (value: string) => {
    setPurpose(value);
    setHasChanged(value !== (borrower.purposeNotes || ''));
  };

  const handleSave = async () => {
    if (!hasChanged) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateBorrowerPurpose(borrower.borrowerId, purpose);
      if (result.success) {
        // Update the local borrower data
        borrower.purposeNotes = purpose;
        setHasChanged(false);
        setIsOpen(false);
      } else {
        console.error('Failed to update purpose:', result.error);
        // Reset to original value on error
        setPurpose(borrower.purposeNotes || '');
        setHasChanged(false);
      }
    } catch (error) {
      console.error('Error updating purpose:', error);
      // Reset to original value on error
      setPurpose(borrower.purposeNotes || '');
      setHasChanged(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      // Ctrl+Enter or Cmd+Enter to save and close
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      // Escape to close without saving (if no changes) or reset changes
      e.preventDefault();
      if (hasChanged) {
        setPurpose(borrower.purposeNotes || '');
        setHasChanged(false);
      }
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-4 w-4 p-0 ml-1">
          <IconInfoCircle className="h-3 w-3 text-muted-foreground hover:text-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>Borrower Purpose</DialogTitle>
          <DialogDescription>Why this external borrower needs access to keys.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label htmlFor="purpose" className="text-sm font-medium flex items-center gap-2">
              Purpose Description
              <KeyboardShortcutTip
                shortcuts={[
                  { key: 'Click', action: 'Edit purpose text' },
                  { key: 'Ctrl+Enter', action: 'Save and close' },
                  { key: 'Escape', action: 'Cancel changes' },
                ]}
                position="right"
              />
            </label>
            <Textarea
              id="purpose"
              value={purpose}
              onChange={(e) => handlePurposeChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter purpose for key access..."
              className="mt-1 min-h-20"
              disabled={isLoading}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            <strong>Company:</strong> {borrower.companyName || 'Not specified'}
          </div>
          {hasChanged && (
            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              Changes will be saved when you close this dialog.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button ref={closeButtonRef} onClick={handleSave} disabled={isLoading} className="gap-1">
            {isLoading && <IconLoader className="h-3 w-3 animate-spin" />}
            {hasChanged ? 'Save & Close' : 'Close'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Individual borrowed key information
export type BorrowedKeyInfo = {
  keyLabel: string; // Key label (e.g., "A", "B", etc.)
  copyNumber: number; // Copy number
  keyFunction: string; // Key function/purpose
  borrowedAt: string; // Date when the key was borrowed
  dueDate?: string; // Expected return date
  issueId: string; // Issue record ID
};

// Grouped borrower with all their keys
export type BorrowerWithKeys = {
  borrowerId: string; // Borrower ID for CRUD operations
  borrowerName: string; // Name of the person
  email?: string; // Contact email of the borrower
  phone?: string; // Optional phone number
  isResident: boolean; // True if resident, false if external
  companyName?: string; // Company name (for external only)
  purposeNotes?: string; // Purpose/notes (for external only)
  borrowedKeys: BorrowedKeyInfo[]; // Array of borrowed keys
  activeLoanCount: number; // Total active loans for this borrower
  hasOverdue: boolean; // Whether any loan is overdue
};

// Legacy type for backward compatibility
export type BorrowedKey = BorrowerWithKeys;

// Column visibility interface
export interface ColumnVisibility {
  affiliation: boolean;
  dateIssued: boolean;
  returnDate: boolean;
}

// Utility function to format dates
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const day = date.getDate();
    const monthNames = [
      'jan',
      'feb',
      'mar',
      'apr',
      'maj',
      'jun',
      'jul',
      'aug',
      'sep',
      'okt',
      'nov',
      'dec',
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateString;
  }
};

// Function to generate columns based on visibility settings
export function getVisibleColumns(
  columnVisibility: ColumnVisibility,
): ColumnDef<BorrowerWithKeys>[] {
  const columns: ColumnDef<BorrowerWithKeys>[] = [];

  // Name column (always visible)
  columns.push({
    id: 'name',
    accessorKey: 'borrowerName',
    header: ({ column }: HeaderContext<BorrowerWithKeys, unknown>) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-medium justify-start text-left"
        >
          Name
          <IconArrowsUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }: CellContext<BorrowerWithKeys, unknown>) => {
      return <div className="font-medium">{row.original.borrowerName}</div>;
    },
  });

  // Affiliation column (optional, before keys)
  if (columnVisibility.affiliation) {
    columns.push({
      id: 'affiliation',
      accessorKey: 'affiliation',
      header: 'Affiliation',
      cell: ({ row }: CellContext<BorrowerWithKeys, unknown>) => {
        const borrower = row.original;
        if (borrower.isResident) {
          return (
            <div className="flex items-center gap-1">
              <span>🏠</span>
              <span className="text-sm font-medium">Resident</span>
            </div>
          );
        }
        const displayText = borrower.companyName || 'External';
        return (
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">{displayText}</span>
            <AffiliationInfoDialog borrower={borrower} />
          </div>
        );
      },
    });
  }

  // Keys column (always visible)
  columns.push({
    id: 'borrowedKeys',
    accessorKey: 'borrowedKeys',
    header: 'Keys',
    cell: ({ row }: CellContext<BorrowerWithKeys, unknown>) => {
      const borrower = row.original;

      if (borrower.borrowedKeys.length === 0) {
        return <div className="text-sm text-muted-foreground">No active loans</div>;
      }

      return (
        <div className="flex flex-wrap gap-1.5">
          {borrower.borrowedKeys.map((key: BorrowedKeyInfo, index: number) => {
            const now = new Date();
            const dueDate = key.dueDate ? new Date(key.dueDate) : null;
            const isOverdue = dueDate && dueDate < now;
            const isWarning =
              dueDate && !isOverdue && dueDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Within 7 days

            let variant: 'destructive' | 'outline' | 'secondary' = 'outline';
            let className = 'text-xs font-mono';

            if (isOverdue) {
              variant = 'destructive';
            } else if (isWarning) {
              variant = 'secondary';
              className += ' bg-yellow-400 text-yellow-900 border-yellow-500';
            }

            return (
              <Badge key={index} variant={variant} className={className}>
                {key.keyLabel}
                {key.copyNumber}
              </Badge>
            );
          })}
        </div>
      );
    },
  });

  // Other optional columns

  if (columnVisibility.dateIssued) {
    columns.push({
      id: 'dateIssued',
      accessorKey: 'dateIssued',
      header: 'Issued',
      cell: ({ row }: CellContext<BorrowerWithKeys, unknown>) => {
        const borrower = row.original;
        if (borrower.borrowedKeys.length === 0) {
          return <div className="text-sm text-muted-foreground">—</div>;
        }
        const mostRecentDate = borrower.borrowedKeys
          .map((key) => key.borrowedAt)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
        return <div className="text-sm">{formatDate(mostRecentDate)}</div>;
      },
    });
  }

  if (columnVisibility.returnDate) {
    columns.push({
      id: 'returnDate',
      accessorKey: 'returnDate',
      header: 'Due',
      cell: ({ row }: CellContext<BorrowerWithKeys, unknown>) => {
        const borrower = row.original;
        if (borrower.borrowedKeys.length === 0) {
          return <div className="text-sm text-muted-foreground">—</div>;
        }
        const returnDates = borrower.borrowedKeys
          .map((key) => key.dueDate)
          .filter(Boolean) as string[];
        if (returnDates.length === 0) {
          return <div className="text-sm text-muted-foreground">No date set</div>;
        }
        const earliestDate = returnDates.sort(
          (a, b) => new Date(a).getTime() - new Date(b).getTime(),
        )[0];
        const isOverdue = new Date(earliestDate) < new Date();
        return (
          <div className={`text-sm ${isOverdue ? 'text-destructive font-medium' : ''}`}>
            {formatDate(earliestDate)}
            {isOverdue && ' (Overdue)'}
          </div>
        );
      },
    });
  }

  // Notes column removed per requirements

  // Actions column (always visible, always last)
  columns.push({
    id: 'actions',
    header: () => null,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }: CellContext<BorrowerWithKeys, unknown>) => {
      const record = row.original;
      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Contact Actions</DropdownMenuLabel>
              {record.email && (
                <DropdownMenuItem onClick={() => (window.location.href = `mailto:${record.email}`)}>
                  <IconMail className="h-3.5 w-3.5 mr-2" />
                  Email
                </DropdownMenuItem>
              )}
              {record.phone && (
                <DropdownMenuItem onClick={() => (window.location.href = `tel:${record.phone}`)}>
                  <IconPhone className="h-3.5 w-3.5 mr-2" />
                  Call
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Borrower Management</DropdownMenuLabel>
              <DropdownMenuItem>
                <IconEdit className="h-3.5 w-3.5 mr-2" />
                Edit Contact
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconPlus className="h-3.5 w-3.5 mr-2" />
                Issue Key
              </DropdownMenuItem>
              {record.borrowedKeys.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Loan Actions</DropdownMenuLabel>
                  <DropdownMenuItem>
                    <IconKeyOff className="h-3.5 w-3.5 mr-2" />
                    Return Keys ({record.borrowedKeys.length})
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  });

  return columns;
}

// Default column visibility for new users
export const defaultColumnVisibility: ColumnVisibility = {
  affiliation: true,
  dateIssued: false,
  returnDate: false,
};

// Mobile-optimized column visibility
export const mobileColumnVisibility: ColumnVisibility = {
  affiliation: false,
  dateIssued: false,
  returnDate: false,
};

// Default columns (for backward compatibility)
export const columns: ColumnDef<BorrowerWithKeys>[] = getVisibleColumns(defaultColumnVisibility);

// Legacy columns export for backward compatibility
export const legacyColumns = columns;
