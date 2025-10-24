'use client';

import { useState, useRef } from 'react';
import { ColumnDef, HeaderContext, CellContext } from '@tanstack/react-table';

import { IconArrowsUpDown, IconInfoCircle, IconLoader } from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { updateBorrowerPurpose } from '@/app/actions/dashboard';
import { updateBorrowerAffiliation } from '@/app/actions/borrowers';
import { BorrowerActionsMenu, type DialogType } from './borrower-actions-menu';

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
      // If resident and purpose/company added, prompt convert
      if (!borrower.isResident) {
        const result = await updateBorrowerPurpose(borrower.borrowerId, purpose);
        if (result.success) {
          borrower.purposeNotes = purpose;
          setHasChanged(false);
          setIsOpen(false);
        } else {
          console.error('Failed to update purpose:', result.error);
          setPurpose(borrower.purposeNotes || '');
          setHasChanged(false);
        }
      } else {
        // For residents, converting to external when adding purpose/company info
        const confirmConvert = window.confirm('Convert to external borrower and save purpose?');
        if (!confirmConvert) {
          setIsLoading(false);
          return;
        }
        const convert = await updateBorrowerAffiliation({
          borrowerId: borrower.borrowerId,
          target: 'EXTERNAL',
          data: {
            name: borrower.borrowerName,
            email: borrower.email || '',
            phone: borrower.phone,
            company: borrower.companyName || 'External',
            borrowerPurpose: purpose,
          },
        });
        if (convert.success) {
          borrower.purposeNotes = purpose;
          setHasChanged(false);
          setIsOpen(false);
        } else {
          console.error('Failed to convert borrower:', convert.error);
          setPurpose(borrower.purposeNotes || '');
          setHasChanged(false);
        }
      }
    } catch (error) {
      console.error('Error updating purpose:', error);
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
    accessorKey: 'name',
    id: 'name',
    header: ({ column }: HeaderContext<BorrowerWithKeys, unknown>) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <IconArrowsUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }: CellContext<BorrowerWithKeys, unknown>) => {
      return <div className="font-medium">{row.original.borrowerName}</div>;
    },
    enableHiding: false,
  });

  // Affiliation column (toggleable)
  if (columnVisibility.affiliation) {
    columns.push({
      accessorKey: 'affiliation',
      id: 'affiliation',
      header: () => <div>Affiliation</div>,
      cell: ({ row }: CellContext<BorrowerWithKeys, unknown>) => {
        const borrower = row.original;
        return (
          <div className="flex items-center gap-1">
            {borrower.isResident ? (
              <Badge variant="secondary" className="text-xs">
                Resident
              </Badge>
            ) : (
              <>
                <Badge variant="outline" className="text-xs">
                  {borrower.companyName || 'External'}
                </Badge>
                <AffiliationInfoDialog borrower={borrower} />
              </>
            )}
          </div>
        );
      },
    });
  }

  // Borrowed Keys column (always visible)
  columns.push({
    accessorKey: 'keys',
    id: 'keys',
    header: ({ column }: HeaderContext<BorrowerWithKeys, unknown>) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Borrowed Keys
          <IconArrowsUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }: CellContext<BorrowerWithKeys, unknown>) => {
      const borrower = row.original;
      return (
        <div className="space-y-1">
          {borrower.borrowedKeys.map((key, index) => {
            const isOverdue =
              key.dueDate && new Date(key.dueDate) < new Date() && !key.dueDate.startsWith('9999');
            const isWarning =
              key.dueDate &&
              new Date(key.dueDate) > new Date() &&
              new Date(key.dueDate).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;

            return (
              <div key={index} className="flex items-center gap-2">
                <Badge
                  variant={isOverdue ? 'destructive' : isWarning ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {key.keyLabel}
                  {key.copyNumber}
                </Badge>
                <span className="text-sm text-muted-foreground">{key.keyFunction}</span>
              </div>
            );
          })}
        </div>
      );
    },
    enableHiding: false,
    sortingFn: (rowA, rowB) => {
      return rowA.original.borrowedKeys.length - rowB.original.borrowedKeys.length;
    },
  });

  // Date Issued column (toggleable)
  if (columnVisibility.dateIssued) {
    columns.push({
      accessorKey: 'dateIssued',
      id: 'dateIssued',
      header: ({ column }: HeaderContext<BorrowerWithKeys, unknown>) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Date Issued
            <IconArrowsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }: CellContext<BorrowerWithKeys, unknown>) => {
        const borrower = row.original;
        return (
          <div className="space-y-1">
            {borrower.borrowedKeys.map((key, index) => (
              <div key={index} className="text-sm text-muted-foreground">
                {formatDate(key.borrowedAt)}
              </div>
            ))}
          </div>
        );
      },
    });
  }

  // Return Date column (toggleable)
  if (columnVisibility.returnDate) {
    columns.push({
      accessorKey: 'returnDate',
      id: 'returnDate',
      header: ({ column }: HeaderContext<BorrowerWithKeys, unknown>) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Due Date
            <IconArrowsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }: CellContext<BorrowerWithKeys, unknown>) => {
        const borrower = row.original;
        return (
          <div className="space-y-1">
            {borrower.borrowedKeys.map((key, index) => {
              const isOverdue =
                key.dueDate &&
                new Date(key.dueDate) < new Date() &&
                !key.dueDate.startsWith('9999');
              const isWarning =
                key.dueDate &&
                new Date(key.dueDate) > new Date() &&
                new Date(key.dueDate).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;

              return (
                <div key={index} className="text-sm">
                  {key.dueDate ? (
                    <span
                      className={
                        isOverdue
                          ? 'text-destructive font-medium'
                          : isWarning
                            ? 'text-amber-600 font-medium'
                            : 'text-muted-foreground'
                      }
                    >
                      {formatDate(key.dueDate)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">No due date</span>
                  )}
                </div>
              );
            })}
          </div>
        );
      },
    });
  }

  // Actions column (always visible, always last)
  columns.push({
    id: 'actions',
    header: () => null,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row, table }: CellContext<BorrowerWithKeys, unknown>) => {
      const borrower = row.original;
      const onOpenDialog = (table.options.meta as any)?.onOpenDialog;

      if (!onOpenDialog) {
        console.error('onOpenDialog not found in table meta');
        return null;
      }

      return (
        <BorrowerActionsMenu
          borrower={borrower}
          onOpenDialog={(type: DialogType) => onOpenDialog(type, borrower)}
        />
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

