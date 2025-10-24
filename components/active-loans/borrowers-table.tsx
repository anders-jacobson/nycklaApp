'use client';

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { IconPlus } from '@tabler/icons-react';
import { ColumnCustomizer } from './column-customizer';
import { AffiliationFilter, AffiliationFilterValue } from './affiliation-filter';
import { getVisibleColumns, BorrowerWithKeys } from './borrower-columns';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import Link from 'next/link';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { ReturnKeysDialog } from './dialogs/return-keys-dialog';
import { LostKeyDialog } from './dialogs/lost-key-dialog';
import { ReplaceKeyDialog } from './dialogs/replace-key-dialog';
import type { DialogType } from './borrower-actions-menu';

interface DataTableProps<TData> {
  data: TData[]; // Borrowers data only
}

// Dialog state type
type DialogState = {
  type: DialogType | null;
  borrower: BorrowerWithKeys | null;
};

export function DataTable<TData>({ data }: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [dialogState, setDialogState] = React.useState<DialogState>({
    type: null,
    borrower: null,
  });
  const [affiliationFilter, setAffiliationFilter] = React.useState<AffiliationFilterValue>('all');

  // Use column preferences hook
  const { columnVisibility, setColumnVisibility } = useColumnPreferences();

  // Filter data based on affiliation filter
  const filteredData = React.useMemo(() => {
    if (affiliationFilter === 'all') return data;

    return (data as BorrowerWithKeys[]).filter((borrower) => {
      if (affiliationFilter === 'residents') return borrower.isResident;
      if (affiliationFilter === 'companies') return !borrower.isResident;
      return true;
    }) as TData[];
  }, [data, affiliationFilter]);

  // Generate columns based on visibility settings
  const columns = React.useMemo(() => {
    return getVisibleColumns(columnVisibility) as ColumnDef<TData>[];
  }, [columnVisibility]);

  // Dialog control functions
  const openDialog = React.useCallback((type: DialogType, borrower: BorrowerWithKeys) => {
    setDialogState({ type, borrower });
  }, []);

  const closeDialog = React.useCallback(() => {
    setDialogState({ type: null, borrower: null });
  }, []);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    meta: {
      // Pass dialog opener to columns via table meta
      onOpenDialog: openDialog,
    },
  });

  // Handle filtering by name and company
  const handleNameFilter = (value: string) => {
    setColumnFilters([
      {
        id: 'name',
        value: value,
      },
    ]);
  };

  const currentBorrower = dialogState.borrower;

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">All Borrowers</h2>
            <p className="text-muted-foreground">
              Manage borrower contacts and track borrowed keys
            </p>
          </div>
        </div>

        {/* Search, Filter and Actions */}
        <div className="flex items-center justify-between gap-2 py-4">
          <Input
            placeholder="Filter by name or company..."
            value={(columnFilters.find((f) => f.id === 'name')?.value as string) ?? ''}
            onChange={(event) => handleNameFilter(event.target.value)}
            className="flex-1 min-w-60 max-w-sm"
          />
          <div className="ml-auto flex items-center gap-2">
            <AffiliationFilter value={affiliationFilter} onValueChange={setAffiliationFilter} />
            <ColumnCustomizer
              columnVisibility={columnVisibility}
              onColumnVisibilityChange={setColumnVisibility}
            />
            <Button asChild className="gap-1">
              <Link href="/issue-key">
                <IconPlus className="h-3.5 w-3.5" />
                <span className="sr-only md:not-sr-only md:whitespace-nowrap">Issue Key</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Table */}
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
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <div className="text-muted-foreground">No borrowers found</div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <DataTablePagination table={table} />
      </div>

      {/* Dialogs - Rendered as siblings to table, not nested */}
      {currentBorrower && (
        <>
          <ReturnKeysDialog
            open={dialogState.type === 'return-keys'}
            onOpenChange={closeDialog}
            borrowerName={currentBorrower.borrowerName}
            borrowedKeys={currentBorrower.borrowedKeys}
            totalKeysForBorrower={currentBorrower.activeLoanCount}
          />
          <LostKeyDialog
            open={dialogState.type === 'lost-key'}
            onOpenChange={closeDialog}
            borrowerName={currentBorrower.borrowerName}
            borrowedKeys={currentBorrower.borrowedKeys}
            isLastKeyForBorrower={
              currentBorrower.borrowedKeys.length === currentBorrower.activeLoanCount
            }
          />
          <ReplaceKeyDialog
            open={dialogState.type === 'replace-key'}
            onOpenChange={closeDialog}
            borrowerName={currentBorrower.borrowerName}
            borrowedKeys={currentBorrower.borrowedKeys}
          />
        </>
      )}
    </>
  );
}
