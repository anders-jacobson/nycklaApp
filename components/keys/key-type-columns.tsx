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
} from '@tabler/icons-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type KeyTypeRow = {
  id: string;
  label: string;
  name: string;
  accessArea: string;
  copies: number;
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
  columnVisibility: KeyTypeColumnVisibility;
}): ColumnDef<KeyTypeRow>[] {
  const { updateAction, deleteAction, addCopyAction, columnVisibility } = params;

  const columns: ColumnDef<KeyTypeRow>[] = [];

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
    cell: ({ row }: CellContext<KeyTypeRow, unknown>) => <div>{row.original.copies}</div>,
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
