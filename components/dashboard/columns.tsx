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
import {
  IconMail,
  IconPhone,
  IconBuilding,
  IconKeyOff,
  IconEdit,
  IconUserPlus,
} from '@tabler/icons-react';

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
  company?: string; // Company name if applicable
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
          className="p-0 text-left"
        >
          Borrower
          <IconArrowsUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="space-y-1">
          <div className="font-medium">{record.borrowerName}</div>
          <div className="text-sm text-muted-foreground space-y-1">
            {record.email && (
              <div className="flex items-center gap-1">
                <IconMail className="h-3 w-3" />
                <span className="truncate max-w-[150px]">{record.email}</span>
              </div>
            )}
            {record.phone && (
              <div className="flex items-center gap-1">
                <IconPhone className="h-3 w-3" />
                <span>{record.phone}</span>
              </div>
            )}
            {record.company && (
              <div className="flex items-center gap-1">
                <IconBuilding className="h-3 w-3" />
                <span className="truncate max-w-[150px]">{record.company}</span>
              </div>
            )}
          </div>
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
          {borrower.borrowedKeys.map((key, index) => (
            <Badge key={index} variant="outline" className="text-xs font-mono">
              {key.keyLabel}{key.copyNumber}
            </Badge>
          ))}
        </div>
      );
    },
  },
    {
    accessorKey: 'lendingStatus',
    header: 'Status & Dates',
    cell: ({ row }) => {
      const borrower = row.original;

      if (borrower.activeLoanCount === 0) {
        return <div className="text-sm text-muted-foreground">No active loans</div>;
      }

      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant={borrower.hasOverdue ? 'destructive' : 'secondary'} className="text-xs">
              {borrower.activeLoanCount} active
            </Badge>
            {borrower.hasOverdue && (
              <Badge variant="destructive" className="text-xs">
                Overdue
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {borrower.activeLoanCount} key{borrower.activeLoanCount !== 1 ? 's' : ''} borrowed
          </div>
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
