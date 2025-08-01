'use client';

import { ColumnDef } from '@tanstack/react-table';

import { IconArrowsUpDown, IconDots } from '@tabler/icons-react';

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
import { IconMail, IconPhone, IconKeyOff, IconEdit, IconUserPlus } from '@tabler/icons-react';

// Individual borrowed key information
export type BorrowedKeyInfo = {
  keyLabel: string; // Key label (e.g., "A", "B", etc.)
  copyNumber: number; // Copy number
  keyFunction: string; // Key function/purpose
  borrowedAt: string; // Date when the key was borrowed
  endDate?: string; // Expected return date
  lendingId: string; // Lending record ID
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

// Simplified columns for borrowers with keys only
export const columns: ColumnDef<BorrowerWithKeys>[] = [
  {
    accessorKey: 'borrowerName',
    header: ({ column }) => {
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
    cell: ({ row }) => {
      const record = row.original;
      return <div className="font-medium">{record.borrowerName}</div>;
    },
  },
  {
    accessorKey: 'affiliation',
    header: 'Affiliation',
    cell: ({ row }) => {
      const borrower = row.original;
      
      if (borrower.isResident) {
        return (
          <div className="flex items-center gap-1">
            <span>🏠</span>
            <span className="text-sm font-medium">Resident</span>
          </div>
        );
      }
      
      // External borrower
      const displayText = borrower.companyName || 'External';
      const hasNotes = borrower.purposeNotes && borrower.purposeNotes.length > 0;
      
      return (
        <div className="space-y-1">
          <div className="text-sm font-medium">{displayText}</div>
          {hasNotes && (
            <div className="text-xs text-muted-foreground truncate max-w-[120px]" title={borrower.purposeNotes}>
              {borrower.purposeNotes}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'borrowedKeys',
    header: 'Currently Borrowed Keys',
    cell: ({ row }) => {
      const borrower = row.original;

      if (borrower.borrowedKeys.length === 0) {
        return <div className="text-sm text-muted-foreground">No active loans</div>;
      }

      return (
        <div className="flex flex-wrap gap-1.5">
          {borrower.borrowedKeys.map((key, index) => {
            // Check if this specific key is overdue
            const isOverdue = key.endDate && new Date(key.endDate) < new Date();

            return (
              <Badge
                key={index}
                variant={isOverdue ? 'destructive' : 'outline'}
                className="text-xs font-mono"
              >
                {key.keyLabel}
                {key.copyNumber}
              </Badge>
            );
          })}
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const record = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <IconDots className="h-4 w-4" />
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
              <IconUserPlus className="h-3.5 w-3.5 mr-2" />
              Lend Key
            </DropdownMenuItem>

            {/* Show return option if borrower has active loans */}
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
      );
    },
  },
];

// Legacy columns export for backward compatibility
export const legacyColumns = columns;
