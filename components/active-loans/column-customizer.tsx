'use client';

import * as React from 'react';
import { DropdownMenuCheckboxItemProps } from '@radix-ui/react-dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconColumns, IconEye } from '@tabler/icons-react';
import { ColumnVisibility } from './borrower-columns';

type Checked = DropdownMenuCheckboxItemProps['checked'];

interface ColumnCustomizerProps {
  columnVisibility: ColumnVisibility;
  onColumnVisibilityChange: (columnVisibility: ColumnVisibility) => void;
}

export function ColumnCustomizer({
  columnVisibility,
  onColumnVisibilityChange,
}: ColumnCustomizerProps) {
  const handleColumnToggle = (columnKey: keyof ColumnVisibility, checked: Checked) => {
    onColumnVisibilityChange({
      ...columnVisibility,
      [columnKey]: checked,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-1">
          <IconColumns className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Customize Columns</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="flex items-center gap-2">
          <IconEye className="h-4 w-4" />
          Show Columns
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuCheckboxItem
          checked={columnVisibility.affiliation}
          onCheckedChange={(checked) => handleColumnToggle('affiliation', checked)}
        >
          Affiliation
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={columnVisibility.dateIssued}
          onCheckedChange={(checked) => handleColumnToggle('dateIssued', checked)}
        >
          Issued
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={columnVisibility.returnDate}
          onCheckedChange={(checked) => handleColumnToggle('returnDate', checked)}
        >
          Due
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={columnVisibility.notes}
          onCheckedChange={(checked) => handleColumnToggle('notes', checked)}
        >
          Notes
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
