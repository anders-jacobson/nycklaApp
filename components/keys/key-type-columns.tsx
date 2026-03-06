'use client';

// Minimal-change note: This file is a keys-specific columns config modeled after the
// borrowers table, to avoid touching existing table code. When we have more tables,
// consider extracting a shared DataTableBase.

import { ColumnDef, HeaderContext, CellContext } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  IconArrowsUpDown,
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconPlus,
  IconChevronRight,
  IconChevronDown,
  IconAlertCircle,
  IconCheck,
} from '@tabler/icons-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export type KeyCopy = {
  id: string;
  copyNumber: number;
  status: 'AVAILABLE' | 'OUT' | 'LOST';
  borrower: {
    id: string;
    name: string;
  } | null;
};

export type KeyTypeRow = {
  id: string;
  label: string;
  name: string;
  accessArea: string;
  copies: KeyCopy[];
};

// Column visibility interface for key types
export interface KeyTypeColumnVisibility {
  name: boolean;
  accessArea: boolean;
}

// Default column visibility
export const defaultKeyTypeColumnVisibility: KeyTypeColumnVisibility = {
  name: true,
  accessArea: true,
};

export function getKeyTypeColumns(params: {
  updateAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
  addCopyAction: (formData: FormData) => void | Promise<void>;
  markLostAction: (formData: FormData) => void | Promise<void>;
  markFoundAction: (formData: FormData) => void | Promise<void>;
  columnVisibility: KeyTypeColumnVisibility;
  expandedRows: Set<string>;
  onToggleExpand: (keyTypeId: string) => void;
}): ColumnDef<KeyTypeRow>[] {
  const {
    updateAction,
    deleteAction,
    addCopyAction,
    markLostAction,
    markFoundAction,
    columnVisibility,
    expandedRows,
    onToggleExpand,
  } = params;

  const columns: ColumnDef<KeyTypeRow>[] = [];

  // Chevron column (always visible, first column)
  columns.push({
    id: 'expand',
    header: () => null,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }: CellContext<KeyTypeRow, unknown>) => {
      const kt = row.original;
      const hasCopies = kt.copies.length > 0;
      const isExpanded = expandedRows.has(kt.id);

      if (!hasCopies) {
        return <div className="w-8" />;
      }

      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onToggleExpand(kt.id)}
        >
          {isExpanded ? (
            <IconChevronDown className="h-4 w-4" />
          ) : (
            <IconChevronRight className="h-4 w-4" />
          )}
          <span className="sr-only">{isExpanded ? 'Collapse' : 'Expand'}</span>
        </Button>
      );
    },
  });

  // Label column (always visible)
  columns.push({
    id: 'label',
    accessorKey: 'label',
    header: ({ column }: HeaderContext<KeyTypeRow, unknown>) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-auto p-0 font-medium justify-start text-left"
      >
        Label
        <IconArrowsUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }: CellContext<KeyTypeRow, unknown>) => (
      <div className="font-mono">{row.original.label}</div>
    ),
  });

  // Name column (optional)
  if (columnVisibility.name) {
    columns.push({
      id: 'name',
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }: CellContext<KeyTypeRow, unknown>) => <div>{row.original.name}</div>,
    });
  }

  // Access Area column (optional)
  if (columnVisibility.accessArea) {
    columns.push({
      id: 'accessArea',
      accessorKey: 'accessArea',
      header: 'Access Area',
      cell: ({ row }: CellContext<KeyTypeRow, unknown>) => (
        <div className="text-muted-foreground">{row.original.accessArea || '—'}</div>
      ),
    });
  }

  // Copies column (always visible)
  columns.push({
    id: 'copies',
    accessorKey: 'copies',
    header: 'Copies',
    cell: ({ row }: CellContext<KeyTypeRow, unknown>) => <div>{row.original.copies.length}</div>,
  });

  // Actions column (always visible)
  columns.push({
    id: 'actions',
    header: () => null,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }: CellContext<KeyTypeRow, unknown>) => {
      const kt = row.original;
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
              <DropdownMenuLabel>Key Type Actions</DropdownMenuLabel>
              <form action={addCopyAction}>
                <Input type="hidden" name="id" value={kt.id} />
                <DropdownMenuItem asChild>
                  <button type="submit" className="w-full">
                    <IconPlus className="h-3.5 w-3.5 mr-2" />
                    Add Copy
                  </button>
                </DropdownMenuItem>
              </form>
              <DropdownMenuSeparator />
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <IconEdit className="h-3.5 w-3.5 mr-2" />
                    Edit
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Key Type</DialogTitle>
                  </DialogHeader>
                  <form action={updateAction} className="grid gap-3">
                    <Input type="hidden" name="id" value={kt.id} />
                    <Input name="name" defaultValue={kt.name} required minLength={2} />
                    <Input name="accessArea" defaultValue={kt.accessArea} />
                    <DialogFooter>
                      <Button type="submit">Save</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              <DropdownMenuSeparator />
              <form action={deleteAction}>
                <Input type="hidden" name="id" value={kt.id} />
                <DropdownMenuItem asChild>
                  <button type="submit" className="w-full text-destructive">
                    <IconTrash className="h-3.5 w-3.5 mr-2" />
                    Delete
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  });

  return columns;
}

// Helper function to get status badge variant and text
function getStatusBadge(status: KeyCopy['status']) {
  switch (status) {
    case 'AVAILABLE':
      return { variant: 'default' as const, text: 'Available', className: 'bg-green-100 text-green-800 hover:bg-green-100' };
    case 'OUT':
      return { variant: 'secondary' as const, text: 'In Use', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100' };
    case 'LOST':
      return { variant: 'destructive' as const, text: 'Lost', className: 'bg-red-100 text-red-800 hover:bg-red-100' };
  }
}

// Expanded Copies Row Component
export function ExpandedCopiesRow({
  copies,
  markLostAction,
  markFoundAction,
  colSpan,
}: {
  copies: KeyCopy[];
  markLostAction: (formData: FormData) => void | Promise<void>;
  markFoundAction: (formData: FormData) => void | Promise<void>;
  colSpan: number;
}) {
  if (copies.length === 0) return null;

  return (
    <tr className="bg-muted/50 hover:bg-muted/50">
      <td colSpan={colSpan} className="p-4">
        <div className="space-y-2">
          {copies.map((copy) => {
            const badge = getStatusBadge(copy.status);
            return (
              <div
                key={copy.id}
                className="flex items-center justify-between py-2 px-3 bg-background rounded-md border"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Copy #{copy.copyNumber}
                  </span>
                  <Badge className={badge.className}>{badge.text}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  {copy.status === 'AVAILABLE' && (
                    <form action={markLostAction}>
                      <Input type="hidden" name="copyId" value={copy.id} />
                      <Button
                        type="submit"
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5"
                      >
                        <IconAlertCircle className="h-3.5 w-3.5" />
                        Mark Lost
                      </Button>
                    </form>
                  )}
                  {copy.status === 'OUT' && copy.borrower && (
                    <>
                      <span className="text-sm text-muted-foreground">
                        In use by <span className="font-medium">{copy.borrower.name}</span>
                      </span>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => {
                          window.location.href = `/active-loans?borrowerId=${copy.borrower!.id}`;
                        }}
                      >
                        View →
                      </Button>
                    </>
                  )}
                  {copy.status === 'OUT' && !copy.borrower && (
                    <span className="text-sm text-muted-foreground italic">
                      In use (borrower unknown)
                    </span>
                  )}
                  {copy.status === 'LOST' && (
                    <form action={markFoundAction}>
                      <Input type="hidden" name="copyId" value={copy.id} />
                      <Button
                        type="submit"
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5"
                      >
                        <IconCheck className="h-3.5 w-3.5" />
                        Mark Found
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </td>
    </tr>
  );
}
