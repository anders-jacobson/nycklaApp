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
import { IconArrowsUpDown, IconEdit, IconTrash } from '@tabler/icons-react';

export type KeyTypeRow = {
  id: string;
  label: string;
  name: string;
  accessArea: string;
  copies: number;
};

export function getKeyTypeColumns(params: {
  updateAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
}): ColumnDef<KeyTypeRow>[] {
  const { updateAction, deleteAction } = params;

  const columns: ColumnDef<KeyTypeRow>[] = [
    {
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
    },
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }: CellContext<KeyTypeRow, unknown>) => <div>{row.original.name}</div>,
    },
    {
      id: 'accessArea',
      accessorKey: 'accessArea',
      header: 'Access Area',
      cell: ({ row }: CellContext<KeyTypeRow, unknown>) => (
        <div className="text-muted-foreground">{row.original.accessArea || '—'}</div>
      ),
    },
    {
      id: 'copies',
      accessorKey: 'copies',
      header: 'Copies',
      cell: ({ row }: CellContext<KeyTypeRow, unknown>) => <div>{row.original.copies}</div>,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: CellContext<KeyTypeRow, unknown>) => {
        const kt = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <IconEdit className="h-3.5 w-3.5" /> Edit
                </Button>
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
            <form action={deleteAction}>
              <Input type="hidden" name="id" value={kt.id} />
              <Button variant="destructive" size="sm" className="gap-1">
                <IconTrash className="h-3.5 w-3.5" /> Delete
              </Button>
            </form>
          </div>
        );
      },
    },
  ];

  return columns;
}




