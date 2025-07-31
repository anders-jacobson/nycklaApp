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
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { IconPlus, IconUsers, IconClockRecord, IconUserPlus } from '@tabler/icons-react';

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  allBorrowersData?: TData[]; // Additional data for "All Borrowers" view
}

export function DataTable<TData>({ 
  columns, 
  data, 
  allBorrowersData
}: DataTableProps<TData>) {
  const [viewMode, setViewMode] = React.useState<'loans' | 'borrowers'>('borrowers');
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  // Determine current data based on view mode
  const currentData = viewMode === 'loans' ? data : (allBorrowersData || data);
  
  const table = useReactTable({
    data: currentData,
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
  });

  // Handle filtering by name
  const handleNameFilter = (value: string) => {
    table.getColumn('borrowerName')?.setFilterValue(value);
  };

  // Count active loans in current data
  const activeLoanCount = data.length;
  const totalBorrowerCount = allBorrowersData?.length || 0;

  return (
    <div className="space-y-4">
      {/* View Toggle Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'loans' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('loans')}
            className="gap-1"
          >
            <IconClockRecord className="h-4 w-4" />
            Active Loans
            {activeLoanCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs">
                {activeLoanCount}
              </Badge>
            )}
          </Button>
          <Button
            variant={viewMode === 'borrowers' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('borrowers')}
            className="gap-1"
          >
            <IconUsers className="h-4 w-4" />
            All Borrowers
            {totalBorrowerCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs">
                {totalBorrowerCount}
              </Badge>
            )}
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-1">
            <IconUserPlus className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Borrower</span>
          </Button>
          <Button className="gap-1">
            <IconPlus className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Lend Key</span>
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center justify-between py-4 space-x-2 w-full">
        <Input
          placeholder="Filter by name..."
          value={(table.getColumn('borrowerName')?.getFilterValue() as string) ?? ''}
          onChange={(event) => handleNameFilter(event.target.value)}
          className="max-w-xs"
        />
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
                  <div className="text-muted-foreground">
                    {viewMode === 'loans' ? 'No active loans' : 'No borrowers found'}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4 w-full">
        <span className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
