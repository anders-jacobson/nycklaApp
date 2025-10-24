'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconFilter, IconUserCheck } from '@tabler/icons-react';

export type AffiliationFilterValue = 'all' | 'residents' | 'companies';

interface AffiliationFilterProps {
  value: AffiliationFilterValue;
  onValueChange: (value: AffiliationFilterValue) => void;
}

export function AffiliationFilter({ value, onValueChange }: AffiliationFilterProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-1">
          <IconFilter className="h-3.5 w-3.5" />
          <span className="sr-only md:not-sr-only md:whitespace-nowrap">Filter Affiliation</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="flex items-center gap-2">
          <IconUserCheck className="h-4 w-4" />
          Filter by Affiliation
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          <DropdownMenuRadioItem value="all">All Borrowers</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="residents">Residents Only</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="companies">Companies Only</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
