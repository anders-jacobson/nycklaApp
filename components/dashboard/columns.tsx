'use client';

import { ColumnDef } from '@tanstack/react-table';

import { IconArrowsUpDown, IconDots } from '@tabler/icons-react';

// Helper function to format date as "day month year"
function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

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

// Enhanced type that combines borrowing data with contact management
export type EnhancedLoanRecord = {
  // Borrower information
  borrowerId: string; // Borrower ID for CRUD operations
  borrowerName: string; // Name of the person
  email?: string; // Contact email of the borrower
  phone?: string; // Optional phone number
  company?: string; // Company name if applicable

  // Key information
  keyId: string; // Key ID
  keyLabel: string; // Key label (e.g., "A", "B", etc.)
  keyFunction: string; // Key function/purpose
  copyNumber: number; // Copy number

  // Lending information
  lendingId?: string; // Lending record ID (null for borrower-only rows)
  borrowedAt?: string; // Date when the key was borrowed
  expectedReturnAt?: string; // Expected return date
  returnedAt?: string; // Date when the key was returned (optional)
  notes?: string; // Lending notes
  idChecked?: boolean; // Whether ID was checked

  // Status and metadata
  isActiveLoan: boolean; // Whether this is an active loan or just borrower info
  activeLoanCount: number; // Total active loans for this borrower
  isOverdue?: boolean; // Whether the loan is overdue
};

// Legacy type for backward compatibility during transition
export type BorrowedKey = EnhancedLoanRecord;

// Enhanced columns that combine loan and contact management
export const columns: ColumnDef<EnhancedLoanRecord>[] = [
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
      const record = row.original;

      // Work with the actual current data structure from getBorrowedKeysTableData
      if (record.keyLabel && record.copyNumber !== undefined) {
        return (
          <div className="space-y-1">
            <Badge variant="outline" className="text-xs font-mono">
              {record.keyLabel}{record.copyNumber}
            </Badge>
            {/* Note: keyFunction not available in current data - will add later */}
          </div>
        );
      }

      return <div className="text-sm text-muted-foreground">No active loans</div>;
    },
  },
  {
    accessorKey: 'lendingStatus',
    header: 'Status & Dates',
    cell: ({ row }) => {
      const record = row.original;

      // Work with current data structure
      const borrowedDate = record.borrowedAt ? formatDate(record.borrowedAt) : '';
      const isReturned = record.returnedAt && record.returnedAt !== '';
      
      if (!borrowedDate) {
        return <div className="text-sm text-muted-foreground">No active loans</div>;
      }

      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant={isReturned ? 'outline' : 'secondary'} className="text-xs">
              {isReturned ? 'Returned' : 'Active'}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground space-y-0.5">
            <div>Lent: {borrowedDate}</div>
            {isReturned && record.returnedAt && (
              <div>Returned: {formatDate(record.returnedAt)}</div>
            )}
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

            {/* Show return option if loan is active (not returned) */}
            {record.borrowedAt && (!record.returnedAt || record.returnedAt === '') && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Loan Actions</DropdownMenuLabel>
                <DropdownMenuItem>
                  <IconKeyOff className="h-3.5 w-3.5 mr-2" />
                  Return Key
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
