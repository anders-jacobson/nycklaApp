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
import { KeyTypeColumnVisibility } from './key-type-columns';

type Checked = DropdownMenuCheckboxItemProps['checked'];

interface KeyTypeColumnCustomizerProps {
  columnVisibility: KeyTypeColumnVisibility;
  onColumnVisibilityChange: (columnVisibility: KeyTypeColumnVisibility) => void;
}

export function KeyTypeColumnCustomizer({
  columnVisibility,
  onColumnVisibilityChange,
}: KeyTypeColumnCustomizerProps) {
  const handleColumnToggle = (columnKey: keyof KeyTypeColumnVisibility, checked: Checked) => {
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
          checked={columnVisibility.name}
          onCheckedChange={(checked) => handleColumnToggle('name', checked)}
        >
          Name
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={columnVisibility.accessArea}
          onCheckedChange={(checked) => handleColumnToggle('accessArea', checked)}
        >
          Access Area
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Always visible: Label, Copies, Actions
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


