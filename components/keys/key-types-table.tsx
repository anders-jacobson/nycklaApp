'use client';

// Minimal-change note: Keys-specific table shell copied from the borrowers table
// pattern to avoid refactoring existing components. Future: extract DataTableBase.

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { KeyTypeColumnCustomizer } from './key-type-column-customizer';
import {
  getKeyTypeColumns,
  KeyTypeRow,
  KeyTypeColumnVisibility,
  defaultKeyTypeColumnVisibility,
  ExpandedCopiesRow,
} from './key-type-columns';
import { IconPlus } from '@tabler/icons-react';
import { DataTablePagination } from '@/components/shared/data-table-pagination';

type KeyTypesTableProps = {
  data: KeyTypeRow[];
  allAreas: { id: string; name: string }[];
  updateAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
  createAction: (formData: FormData) => void | Promise<void>;
  addCopyAction: (formData: FormData) => void | Promise<void>;
  markLostAction: (formData: FormData) => void | Promise<void>;
  markFoundAction: (formData: FormData) => void | Promise<void>;
};

export function KeyTypesTable({
  data,
  allAreas,
  updateAction,
  deleteAction,
  createAction,
  addCopyAction,
  markLostAction,
  markFoundAction,
}: KeyTypesTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  // Key types column visibility state
  const [columnVisibility, setColumnVisibility] = React.useState<KeyTypeColumnVisibility>(
    defaultKeyTypeColumnVisibility,
  );

  const toggleExpand = React.useCallback((keyTypeId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(keyTypeId)) {
        next.delete(keyTypeId);
      } else {
        next.add(keyTypeId);
      }
      return next;
    });
  }, []);

  const columns = React.useMemo<ColumnDef<KeyTypeRow>[]>(
    () =>
      getKeyTypeColumns({
        updateAction,
        deleteAction,
        addCopyAction,
        columnVisibility,
        expandedRows,
        onToggleExpand: toggleExpand,
        allAreas,
      }),
    [
      updateAction,
      deleteAction,
      addCopyAction,
      columnVisibility,
      expandedRows,
      toggleExpand,
      allAreas,
    ],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters },
  });

  const handleFilter = (value: string) => {
    table.getColumn('label')?.setFilterValue(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Key Types</h2>
          <p className="text-muted-foreground">Manage key types in your organization</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 py-4">
        <Input
          placeholder="Filter by label..."
          value={(table.getColumn('label')?.getFilterValue() as string) ?? ''}
          onChange={(event) => handleFilter(event.target.value)}
          className="max-w-xs"
        />
        <div className="ml-auto flex items-center gap-2">
          <KeyTypeColumnCustomizer
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
          />
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-1">
                <IconPlus className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Key Type</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Key Type</DialogTitle>
              </DialogHeader>
              <form action={createAction} className="grid gap-3">
                <Input name="label" placeholder="Label (e.g. A)" required maxLength={2} />
                <Input name="name" placeholder="Name / Function" required minLength={2} />
                <Input name="accessArea" placeholder="Access area (optional)" />
                <div className="flex items-center gap-2">
                  <Input
                    name="totalCopies"
                    type="number"
                    min={0}
                    defaultValue={0}
                    className="w-28"
                  />
                  <span className="text-sm text-muted-foreground">copies</span>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Key Type</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const keyType = row.original;
                const isExpanded = expandedRows.has(keyType.id);
                return (
                  <React.Fragment key={row.id}>
                    <TableRow data-state={row.getIsSelected() && 'selected'}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    {isExpanded && (
                      <ExpandedCopiesRow
                        copies={keyType.copies}
                        markLostAction={markLostAction}
                        markFoundAction={markFoundAction}
                        colSpan={row.getVisibleCells().length}
                      />
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="text-muted-foreground">No key types found</div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}
