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
import { cn } from '@/lib/utils';

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
import { getVisibleColumns, BorrowerWithKeys, type BorrowerColumnLabels } from './borrower-columns';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import Link from 'next/link';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { useTranslations, useFormatter } from 'next-intl';
import { ReturnKeysDialog } from './dialogs/return-keys-dialog';
import { LostKeyDialog } from './dialogs/lost-key-dialog';
import { ReplaceKeyDialog } from './dialogs/replace-key-dialog';
import type { DialogType } from './borrower-actions-menu';

interface DataTableProps<TData> {
  data: TData[]; // Borrowers data only
  highlightBorrowerId?: string;
}

// Dialog state type
type DialogState = {
  type: DialogType | null;
  borrower: BorrowerWithKeys | null;
};

export function DataTable<TData>({ data, highlightBorrowerId }: DataTableProps<TData>) {
  const t = useTranslations('activeLoans');
  const format = useFormatter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [dialogState, setDialogState] = React.useState<DialogState>({
    type: null,
    borrower: null,
  });
  const [affiliationFilter, setAffiliationFilter] = React.useState<AffiliationFilterValue>('all');
  const [highlightedRow, setHighlightedRow] = React.useState<string | null>(
    highlightBorrowerId || null,
  );

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
    const formatDate = (dateStr: string) => {
      try {
        return format.dateTime(new Date(dateStr), {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      } catch {
        return dateStr;
      }
    };
    const labels: BorrowerColumnLabels = {
      name: t('colName'),
      affiliation: t('colAffiliation'),
      resident: t('colResident'),
      external: t('colExternal'),
      borrowedKeys: t('colBorrowedKeys'),
      dateIssued: t('colDateIssued'),
      dueDate: t('colDueDate'),
      noDueDate: t('noDueDate'),
      due: t('due'),
      daysOverdue: (days) => t('daysOverdue', { days }),
      allIssueDates: t('allIssueDates'),
      allDueDates: t('allDueDates'),
    };
    return getVisibleColumns(columnVisibility, formatDate, labels) as ColumnDef<TData>[];
  }, [columnVisibility, format, t]);

  // Dialog control functions
  const openDialog = React.useCallback((type: DialogType, borrower: BorrowerWithKeys) => {
    setDialogState({ type, borrower });
  }, []);

  const closeDialog = React.useCallback(() => {
    setDialogState({ type: null, borrower: null });
  }, []);

  // eslint-disable-next-line react-hooks/incompatible-library
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

  // Navigate to correct page and scroll to highlighted row
  React.useEffect(() => {
    if (highlightBorrowerId && filteredData.length > 0) {
      // Find the index of the borrower in the filtered data
      const borrowerIndex = (filteredData as BorrowerWithKeys[]).findIndex(
        (b) => b.borrowerId === highlightBorrowerId,
      );

      if (borrowerIndex !== -1) {
        // Calculate which page the borrower is on
        const pageSize = table.getState().pagination.pageSize;
        const targetPage = Math.floor(borrowerIndex / pageSize);

        // Set the table to the correct page
        table.setPageIndex(targetPage);

        // Wait for page change and render, then scroll
        const timer = setTimeout(() => {
          const element = document.querySelector(`[data-borrower-id="${highlightBorrowerId}"]`);
          if (element) {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
            // Clear highlight after 3 seconds
            setTimeout(() => setHighlightedRow(null), 3000);
          }
        }, 200); // Increased delay to allow page change
        return () => clearTimeout(timer);
      }
    }
  }, [highlightBorrowerId, filteredData, table]);

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

  // Close dialog if borrower is no longer available (e.g., deleted after return)
  React.useEffect(() => {
    if (dialogState.type !== null && !currentBorrower) {
      // Force close any open dialogs when borrower is deleted
      closeDialog();
    }
  }, [dialogState.type, currentBorrower, closeDialog]);

  // Cleanup: Ensure dialog closes on unmount
  React.useEffect(() => {
    return () => {
      // Cleanup function - close dialog if component unmounts
      if (dialogState.type !== null) {
        setDialogState({ type: null, borrower: null });
      }
    };
  }, [dialogState.type]);

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t('borrowersHeading')}</h2>
            <p className="text-muted-foreground">{t('borrowersDescription')}</p>
          </div>
        </div>

        {/* Search, Filter and Actions */}
        <div className="flex items-center justify-between gap-2 py-4">
          <Input
            placeholder={t('filterPlaceholder')}
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
                <span className="sr-only md:not-sr-only md:whitespace-nowrap">{t('issueKey')}</span>
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
                table.getRowModel().rows.map((row) => {
                  const borrower = row.original as BorrowerWithKeys;
                  return (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      data-borrower-id={borrower.borrowerId}
                      className={cn(
                        highlightedRow === borrower.borrowerId &&
                          'bg-yellow-100 dark:bg-yellow-900/20 transition-colors duration-1000',
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <div className="text-muted-foreground">{t('empty')}</div>
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
      {/* Always render dialogs but control with open prop - prevents overlay from staying */}
      {currentBorrower && (
        <>
          <ReturnKeysDialog
            key={`return-${currentBorrower.borrowerId}-${dialogState.type}`}
            open={dialogState.type === 'return-keys'}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                closeDialog();
              }
            }}
            borrowerName={currentBorrower.borrowerName}
            borrowedKeys={currentBorrower.borrowedKeys}
            totalKeysForBorrower={currentBorrower.activeLoanCount}
          />
          <LostKeyDialog
            key={`lost-${currentBorrower.borrowerId}-${dialogState.type}`}
            open={dialogState.type === 'lost-key'}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                closeDialog();
              }
            }}
            borrowerName={currentBorrower.borrowerName}
            borrowedKeys={currentBorrower.borrowedKeys}
            isLastKeyForBorrower={currentBorrower.activeLoanCount === 1}
          />
          <ReplaceKeyDialog
            key={`replace-${currentBorrower.borrowerId}-${dialogState.type}`}
            open={dialogState.type === 'replace-key'}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                closeDialog();
              }
            }}
            borrowerName={currentBorrower.borrowerName}
            borrowedKeys={currentBorrower.borrowedKeys}
          />
        </>
      )}
    </>
  );
}
